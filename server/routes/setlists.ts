import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

interface SetlistRow {
  id: string;
  title: string;
  date: string;
  notes: string;
  created_at: string;
}

interface SetlistSongRow {
  setlist_id: string;
  song_id: string;
  position: number;
  cue_in: string;
  cue_out: string;
  notes: string;
}

const songsForSetlist = db.prepare(`
  SELECT * FROM setlist_songs WHERE setlist_id = ? ORDER BY position ASC
`);

const rowToSetlist = (r: SetlistRow) => {
  const songs = (songsForSetlist.all(r.id) as SetlistSongRow[]).map((s) => ({
    songId: s.song_id,
    position: s.position,
    cueIn: s.cue_in,
    cueOut: s.cue_out,
    notes: s.notes,
  }));
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    notes: r.notes,
    songs,
    createdAt: r.created_at,
  };
};

const getOne = (id: string) => {
  const row = db.prepare('SELECT * FROM setlists WHERE id = ?').get(id) as SetlistRow | undefined;
  return row ? rowToSetlist(row) : null;
};

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM setlists ORDER BY created_at DESC').all() as SetlistRow[];
  res.json(rows.map(rowToSetlist));
});

interface SetlistInput {
  id: string;
  title: string;
  date?: string;
  notes?: string;
  createdAt?: string;
  songs?: Array<{ songId: string; position: number; cueIn?: string; cueOut?: string; notes?: string }>;
}

router.post('/', (req, res) => {
  const s: SetlistInput = req.body;
  const createdAt = s.createdAt ?? new Date().toISOString();
  db.prepare(
    'INSERT INTO setlists (id, title, date, notes, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(s.id, s.title, s.date ?? '', s.notes ?? '', createdAt);

  if (s.songs?.length) {
    const insertSong = db.prepare(`
      INSERT INTO setlist_songs (setlist_id, song_id, position, cue_in, cue_out, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const tx = db.transaction((items: NonNullable<SetlistInput['songs']>) => {
      for (const item of items) {
        insertSong.run(s.id, item.songId, item.position, item.cueIn ?? '', item.cueOut ?? '', item.notes ?? '');
      }
    });
    tx(s.songs);
  }

  res.status(201).json(getOne(s.id));
});

const setlistFieldMap: Record<string, string> = {
  title: 'title',
  date: 'date',
  notes: 'notes',
};

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body as Record<string, unknown>;
  const setClauses: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(updates)) {
    const col = setlistFieldMap[k];
    if (col) {
      setClauses.push(`${col} = ?`);
      values.push(v);
    }
  }
  if (setClauses.length > 0) {
    values.push(id);
    db.prepare(`UPDATE setlists SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  }
  const result = getOne(id);
  if (!result) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  res.json(result);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM setlists WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

router.post('/:id/songs', (req, res) => {
  const { id } = req.params;
  const { songId } = req.body as { songId: string };

  const exists = db
    .prepare('SELECT 1 FROM setlist_songs WHERE setlist_id = ? AND song_id = ?')
    .get(id, songId);

  if (!exists) {
    const next = db
      .prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM setlist_songs WHERE setlist_id = ?')
      .get(id) as { next: number };
    db.prepare(`
      INSERT INTO setlist_songs (setlist_id, song_id, position, cue_in, cue_out, notes)
      VALUES (?, ?, ?, '', '', '')
    `).run(id, songId, next.next);
  }
  res.json(getOne(id));
});

router.delete('/:id/songs/:songId', (req, res) => {
  const { id, songId } = req.params;
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM setlist_songs WHERE setlist_id = ? AND song_id = ?').run(id, songId);
    const remaining = db
      .prepare('SELECT song_id FROM setlist_songs WHERE setlist_id = ? ORDER BY position ASC')
      .all(id) as Array<{ song_id: string }>;
    const upd = db.prepare(
      'UPDATE setlist_songs SET position = ? WHERE setlist_id = ? AND song_id = ?'
    );
    remaining.forEach((row, i) => upd.run(i, id, row.song_id));
  });
  tx();
  res.json(getOne(id));
});

router.patch('/:id/songs/:songId', (req, res) => {
  const { id, songId } = req.params;
  const updates = req.body as { cueIn?: string; cueOut?: string; notes?: string };
  const setClauses: string[] = [];
  const values: unknown[] = [];
  if (updates.cueIn !== undefined) {
    setClauses.push('cue_in = ?');
    values.push(updates.cueIn);
  }
  if (updates.cueOut !== undefined) {
    setClauses.push('cue_out = ?');
    values.push(updates.cueOut);
  }
  if (updates.notes !== undefined) {
    setClauses.push('notes = ?');
    values.push(updates.notes);
  }
  if (setClauses.length > 0) {
    values.push(id, songId);
    db.prepare(
      `UPDATE setlist_songs SET ${setClauses.join(', ')} WHERE setlist_id = ? AND song_id = ?`
    ).run(...values);
  }
  res.json(getOne(id));
});

router.put('/:id/songs', (req, res) => {
  const { id } = req.params;
  const songs = req.body as Array<{ songId: string; position: number; cueIn?: string; cueOut?: string; notes?: string }>;
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM setlist_songs WHERE setlist_id = ?').run(id);
    const insert = db.prepare(`
      INSERT INTO setlist_songs (setlist_id, song_id, position, cue_in, cue_out, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    songs.forEach((s) => {
      insert.run(id, s.songId, s.position, s.cueIn ?? '', s.cueOut ?? '', s.notes ?? '');
    });
  });
  tx();
  res.json(getOne(id));
});

export default router;
