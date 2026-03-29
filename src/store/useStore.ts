import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';
import type { Song, Setlist, Connection } from '../types';

const indexedDBStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await idbSet(name, value);
  },
  removeItem: async (name: string) => {
    await del(name);
  },
}));

interface AppState {
  songs: Song[];
  setlists: Setlist[];
  connections: Connection[];

  addSong: (song: Song) => void;
  addSongs: (songs: Song[]) => void;
  updateSong: (id: string, song: Partial<Song>) => void;
  deleteSong: (id: string) => void;

  addSetlist: (setlist: Setlist) => void;
  updateSetlist: (id: string, setlist: Partial<Setlist>) => void;
  deleteSetlist: (id: string) => void;
  addSongToSetlist: (setlistId: string, songId: string) => void;
  removeSongFromSetlist: (setlistId: string, songId: string) => void;
  reorderSetlistSongs: (setlistId: string, songs: { songId: string; position: number }[]) => void;

  addConnection: (connection: Connection) => void;
  addConnections: (connections: Connection[]) => void;
  deleteConnection: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      songs: [],
      setlists: [],
      connections: [],

      addSong: (song) =>
        set((state) => ({ songs: [...state.songs, song] })),

      addSongs: (newSongs) =>
        set((state) => ({ songs: [...state.songs, ...newSongs] })),

      updateSong: (id, updates) =>
        set((state) => ({
          songs: state.songs.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

      deleteSong: (id) =>
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
        })),

      addSetlist: (setlist) =>
        set((state) => ({ setlists: [...state.setlists, setlist] })),

      updateSetlist: (id, updates) =>
        set((state) => ({
          setlists: state.setlists.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteSetlist: (id) =>
        set((state) => ({
          setlists: state.setlists.filter((s) => s.id !== id),
        })),

      addSongToSetlist: (setlistId, songId) =>
        set((state) => ({
          setlists: state.setlists.map((sl) => {
            if (sl.id !== setlistId) return sl;
            if (sl.songs.some((s) => s.songId === songId)) return sl;
            return {
              ...sl,
              songs: [...sl.songs, { songId, position: sl.songs.length }],
            };
          }),
        })),

      removeSongFromSetlist: (setlistId, songId) =>
        set((state) => ({
          setlists: state.setlists.map((sl) => {
            if (sl.id !== setlistId) return sl;
            return {
              ...sl,
              songs: sl.songs
                .filter((s) => s.songId !== songId)
                .map((s, i) => ({ ...s, position: i })),
            };
          }),
        })),

      reorderSetlistSongs: (setlistId, songs) =>
        set((state) => ({
          setlists: state.setlists.map((sl) =>
            sl.id === setlistId ? { ...sl, songs } : sl
          ),
        })),

      addConnection: (connection) =>
        set((state) => ({ connections: [...state.connections, connection] })),

      addConnections: (newConnections) =>
        set((state) => ({ connections: [...state.connections, ...newConnections] })),

      deleteConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
        })),
    }),
    { name: 'mixmaster-storage', storage: indexedDBStorage }
  )
);
