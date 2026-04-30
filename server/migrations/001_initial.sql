CREATE TABLE IF NOT EXISTS songs (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  artist        TEXT NOT NULL,
  bpm           INTEGER,
  key           TEXT NOT NULL DEFAULT '',
  duration      TEXT NOT NULL DEFAULT '',
  release_date  TEXT NOT NULL DEFAULT '',
  energy_level  INTEGER NOT NULL DEFAULT 0,
  genre         TEXT NOT NULL DEFAULT '',
  record_label  TEXT NOT NULL DEFAULT '',
  notes         TEXT NOT NULL DEFAULT '',
  youtube_url   TEXT,
  thumbnail     TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS setlists (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  date        TEXT NOT NULL DEFAULT '',
  notes       TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS setlist_songs (
  setlist_id  TEXT NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  song_id     TEXT NOT NULL REFERENCES songs(id)    ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  cue_in      TEXT NOT NULL DEFAULT '',
  cue_out     TEXT NOT NULL DEFAULT '',
  notes       TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (setlist_id, song_id)
);

CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist
  ON setlist_songs(setlist_id, position);

CREATE TABLE IF NOT EXISTS connections (
  id            TEXT PRIMARY KEY,
  from_song_id  TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  to_song_id    TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  notes         TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_connections_from ON connections(from_song_id);
CREATE INDEX IF NOT EXISTS idx_connections_to   ON connections(to_song_id);
