import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

interface SongRow {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  key: string;
  duration: string;
  release_date: string;
  energy_level: number;
  genre: string;
  record_label: string;
  notes: string;
  youtube_url: string | null;
  thumbnail: string | null;
  created_at: string;
}

const rowToSong = (r: SongRow) => ({
  id: r.id,
  title: r.title,
  artist: r.artist,
  bpm: r.bpm,
  key: r.key,
  duration: r.duration,
  releaseDate: r.release_date,
  energyLevel: r.energy_level,
  genre: r.genre,
  recordLabel: r.record_label,
  notes: r.notes,
  youtubeUrl: r.youtube_url,
  thumbnail: r.thumbnail,
  createdAt: r.created_at,
});

const insertStmt = db.prepare(`
  INSERT INTO songs (id, title, artist, bpm, key, duration, release_date, energy_level, genre, record_label, notes, youtube_url, thumbnail, created_at)
  VALUES (@id, @title, @artist, @bpm, @key, @duration, @release_date, @energy_level, @genre, @record_label, @notes, @youtube_url, @thumbnail, @created_at)
`);

interface SongInput {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  key?: string;
  duration?: string;
  releaseDate?: string;
  energyLevel?: number;
  genre?: string;
  recordLabel?: string;
  notes?: string;
  youtubeUrl?: string | null;
  thumbnail?: string | null;
  createdAt?: string;
}

const songToParams = (s: SongInput) => ({
  id: s.id,
  title: s.title,
  artist: s.artist,
  bpm: s.bpm ?? null,
  key: s.key ?? '',
  duration: s.duration ?? '',
  release_date: s.releaseDate ?? '',
  energy_level: s.energyLevel ?? 0,
  genre: s.genre ?? '',
  record_label: s.recordLabel ?? '',
  notes: s.notes ?? '',
  youtube_url: s.youtubeUrl ?? null,
  thumbnail: s.thumbnail ?? null,
  created_at: s.createdAt ?? new Date().toISOString(),
});

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM songs ORDER BY created_at DESC').all() as SongRow[];
  res.json(rows.map(rowToSong));
});

router.post('/', (req, res) => {
  const params = songToParams(req.body);
  insertStmt.run(params);
  const row = db.prepare('SELECT * FROM songs WHERE id = ?').get(params.id) as SongRow;
  res.status(201).json(rowToSong(row));
});

router.post('/batch', (req, res) => {
  const songs: SongInput[] = req.body;
  if (!Array.isArray(songs)) {
    res.status(400).json({ error: 'expected array' });
    return;
  }
  const insertMany = db.transaction((items: SongInput[]) => {
    for (const s of items) insertStmt.run(songToParams(s));
  });
  insertMany(songs);
  const ids = songs.map((s) => s.id);
  const placeholders = ids.map(() => '?').join(',');
  const rows = ids.length
    ? (db.prepare(`SELECT * FROM songs WHERE id IN (${placeholders})`).all(...ids) as SongRow[])
    : [];
  res.status(201).json(rows.map(rowToSong));
});

const fieldMap: Record<string, string> = {
  title: 'title',
  artist: 'artist',
  bpm: 'bpm',
  key: 'key',
  duration: 'duration',
  releaseDate: 'release_date',
  energyLevel: 'energy_level',
  genre: 'genre',
  recordLabel: 'record_label',
  notes: 'notes',
  youtubeUrl: 'youtube_url',
  thumbnail: 'thumbnail',
};

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body as Record<string, unknown>;
  const setClauses: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(updates)) {
    const col = fieldMap[k];
    if (col) {
      setClauses.push(`${col} = ?`);
      values.push(v);
    }
  }
  if (setClauses.length === 0) {
    const row = db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as SongRow | undefined;
    if (!row) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.json(rowToSong(row));
    return;
  }
  values.push(id);
  db.prepare(`UPDATE songs SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  const row = db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as SongRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  res.json(rowToSong(row));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM songs WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
