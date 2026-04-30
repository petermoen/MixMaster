import type { Song, Setlist, Connection, SetlistSong } from '../types';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const songsApi = {
  list: () => request<Song[]>('GET', '/api/songs'),
  create: (song: Song) => request<Song>('POST', '/api/songs', song),
  createBatch: (songs: Song[]) => request<Song[]>('POST', '/api/songs/batch', songs),
  update: (id: string, updates: Partial<Song>) => request<Song>('PATCH', `/api/songs/${id}`, updates),
  delete: (id: string) => request<void>('DELETE', `/api/songs/${id}`),
};

export const setlistsApi = {
  list: () => request<Setlist[]>('GET', '/api/setlists'),
  create: (setlist: Setlist) => request<Setlist>('POST', '/api/setlists', setlist),
  update: (id: string, updates: Partial<Setlist>) =>
    request<Setlist>('PATCH', `/api/setlists/${id}`, updates),
  delete: (id: string) => request<void>('DELETE', `/api/setlists/${id}`),
  addSong: (setlistId: string, songId: string) =>
    request<Setlist>('POST', `/api/setlists/${setlistId}/songs`, { songId }),
  removeSong: (setlistId: string, songId: string) =>
    request<Setlist>('DELETE', `/api/setlists/${setlistId}/songs/${songId}`),
  updateSong: (setlistId: string, songId: string, updates: Partial<SetlistSong>) =>
    request<Setlist>('PATCH', `/api/setlists/${setlistId}/songs/${songId}`, updates),
  reorderSongs: (setlistId: string, songs: SetlistSong[]) =>
    request<Setlist>('PUT', `/api/setlists/${setlistId}/songs`, songs),
};

export const connectionsApi = {
  list: () => request<Connection[]>('GET', '/api/connections'),
  create: (connection: Connection) => request<Connection>('POST', '/api/connections', connection),
  createBatch: (connections: Connection[]) =>
    request<Connection[]>('POST', '/api/connections/batch', connections),
  delete: (id: string) => request<void>('DELETE', `/api/connections/${id}`),
};

export interface BeatportTrack {
  id: number;
  title: string;
  mixName: string | null;
  artists: string[];
  bpm: number | null;
  key: string | null;
  genre: string | null;
  label: string | null;
  releaseDate: string | null;
  durationMs: number | null;
  artworkUrl: string | null;
  beatportUrl: string;
}

export const metadataApi = {
  search: (query: string) =>
    request<BeatportTrack[]>('GET', `/api/metadata/search?q=${encodeURIComponent(query)}`),
};
