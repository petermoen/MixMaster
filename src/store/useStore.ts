import { create } from 'zustand';
import type { Song, Setlist, Connection } from '../types';
import { songsApi, setlistsApi, connectionsApi } from '../api/client';

interface AppState {
  songs: Song[];
  setlists: Setlist[];
  connections: Connection[];

  loaded: boolean;
  loadError: string | null;
  loadAll: () => Promise<void>;

  addSong: (song: Song) => Promise<void>;
  addSongs: (songs: Song[]) => Promise<void>;
  updateSong: (id: string, song: Partial<Song>) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;

  addSetlist: (setlist: Setlist) => Promise<void>;
  updateSetlist: (id: string, setlist: Partial<Setlist>) => Promise<void>;
  deleteSetlist: (id: string) => Promise<void>;
  addSongToSetlist: (setlistId: string, songId: string) => Promise<void>;
  removeSongFromSetlist: (setlistId: string, songId: string) => Promise<void>;
  updateSetlistSong: (
    setlistId: string,
    songId: string,
    updates: { cueIn?: string; cueOut?: string; notes?: string }
  ) => Promise<void>;
  reorderSetlistSongs: (
    setlistId: string,
    songs: { songId: string; position: number; cueIn?: string; cueOut?: string; notes?: string }[]
  ) => Promise<void>;

  addConnection: (connection: Connection) => Promise<void>;
  addConnections: (connections: Connection[]) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
}

const replaceById = <T extends { id: string }>(arr: T[], item: T) =>
  arr.map((x) => (x.id === item.id ? item : x));

export const useStore = create<AppState>()((set) => ({
  songs: [],
  setlists: [],
  connections: [],
  loaded: false,
  loadError: null,

  loadAll: async () => {
    try {
      const [songs, setlists, connections] = await Promise.all([
        songsApi.list(),
        setlistsApi.list(),
        connectionsApi.list(),
      ]);
      set({ songs, setlists, connections, loaded: true, loadError: null });
    } catch (err) {
      set({
        loadError:
          err instanceof Error
            ? err.message
            : 'Onbekende fout bij laden van data',
      });
    }
  },

  addSong: async (song) => {
    const saved = await songsApi.create(song);
    set((state) => ({ songs: [saved, ...state.songs] }));
  },

  addSongs: async (newSongs) => {
    if (newSongs.length === 0) return;
    const saved = await songsApi.createBatch(newSongs);
    set((state) => ({ songs: [...saved, ...state.songs] }));
  },

  updateSong: async (id, updates) => {
    const saved = await songsApi.update(id, updates);
    set((state) => ({ songs: replaceById(state.songs, saved) }));
  },

  deleteSong: async (id) => {
    await songsApi.delete(id);
    set((state) => ({
      songs: state.songs.filter((s) => s.id !== id),
      setlists: state.setlists.map((sl) => ({
        ...sl,
        songs: sl.songs
          .filter((s) => s.songId !== id)
          .map((s, i) => ({ ...s, position: i })),
      })),
      connections: state.connections.filter(
        (c) => c.fromSongId !== id && c.toSongId !== id
      ),
    }));
  },

  addSetlist: async (setlist) => {
    const saved = await setlistsApi.create(setlist);
    set((state) => ({ setlists: [saved, ...state.setlists] }));
  },

  updateSetlist: async (id, updates) => {
    const saved = await setlistsApi.update(id, updates);
    set((state) => ({ setlists: replaceById(state.setlists, saved) }));
  },

  deleteSetlist: async (id) => {
    await setlistsApi.delete(id);
    set((state) => ({ setlists: state.setlists.filter((s) => s.id !== id) }));
  },

  addSongToSetlist: async (setlistId, songId) => {
    const saved = await setlistsApi.addSong(setlistId, songId);
    set((state) => ({ setlists: replaceById(state.setlists, saved) }));
  },

  removeSongFromSetlist: async (setlistId, songId) => {
    const saved = await setlistsApi.removeSong(setlistId, songId);
    set((state) => ({ setlists: replaceById(state.setlists, saved) }));
  },

  updateSetlistSong: async (setlistId, songId, updates) => {
    const saved = await setlistsApi.updateSong(setlistId, songId, updates);
    set((state) => ({ setlists: replaceById(state.setlists, saved) }));
  },

  reorderSetlistSongs: async (setlistId, songs) => {
    const normalized = songs.map((s) => ({
      songId: s.songId,
      position: s.position,
      cueIn: s.cueIn ?? '',
      cueOut: s.cueOut ?? '',
      notes: s.notes ?? '',
    }));
    const saved = await setlistsApi.reorderSongs(setlistId, normalized);
    set((state) => ({ setlists: replaceById(state.setlists, saved) }));
  },

  addConnection: async (connection) => {
    const saved = await connectionsApi.create(connection);
    set((state) => ({ connections: [saved, ...state.connections] }));
  },

  addConnections: async (newConnections) => {
    if (newConnections.length === 0) return;
    const saved = await connectionsApi.createBatch(newConnections);
    set((state) => ({ connections: [...saved, ...state.connections] }));
  },

  deleteConnection: async (id) => {
    await connectionsApi.delete(id);
    set((state) => ({ connections: state.connections.filter((c) => c.id !== id) }));
  },
}));
