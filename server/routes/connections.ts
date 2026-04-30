import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

interface ConnectionRow {
  id: string;
  from_song_id: string;
  to_song_id: string;
  notes: string;
  created_at: string;
}

interface ConnectionInput {
  id: string;
  fromSongId: string;
  toSongId: string;
  notes?: string;
  createdAt?: string;
}

const rowToConnection = (r: ConnectionRow) => ({
  id: r.id,
  fromSongId: r.from_song_id,
  toSongId: r.to_song_id,
  notes: r.notes,
  createdAt: r.created_at,
});

const insertStmt = db.prepare(`
  INSERT INTO connections (id, from_song_id, to_song_id, notes, created_at)
  VALUES (@id, @from_song_id, @to_song_id, @notes, @created_at)
`);

const toParams = (c: ConnectionInput) => ({
  id: c.id,
  from_song_id: c.fromSongId,
  to_song_id: c.toSongId,
  notes: c.notes ?? '',
  created_at: c.createdAt ?? new Date().toISOString(),
});

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM connections ORDER BY created_at DESC').all() as ConnectionRow[];
  res.json(rows.map(rowToConnection));
});

router.post('/', (req, res) => {
  const params = toParams(req.body);
  insertStmt.run(params);
  const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(params.id) as ConnectionRow;
  res.status(201).json(rowToConnection(row));
});

router.post('/batch', (req, res) => {
  const items: ConnectionInput[] = req.body;
  if (!Array.isArray(items)) {
    res.status(400).json({ error: 'expected array' });
    return;
  }
  const insertMany = db.transaction((arr: ConnectionInput[]) => {
    for (const c of arr) insertStmt.run(toParams(c));
  });
  insertMany(items);
  const ids = items.map((c) => c.id);
  const placeholders = ids.map(() => '?').join(',');
  const rows = ids.length
    ? (db.prepare(`SELECT * FROM connections WHERE id IN (${placeholders})`).all(...ids) as ConnectionRow[])
    : [];
  res.status(201).json(rows.map(rowToConnection));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM connections WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
