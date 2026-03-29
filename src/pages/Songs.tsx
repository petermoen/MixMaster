import { useState } from 'react';
import { Plus, Search, Trash2, Edit3, Music, ChevronUp, ChevronDown, Link, Upload } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SongFormDialog } from '../components/SongFormDialog';
import { SongDetailPanel } from '../components/SongDetailPanel';
import { ZipImportDialog } from '../components/ZipImportDialog';
import type { Song } from '../types';

type SortField = 'title' | 'artist' | 'bpm' | 'key' | 'energyLevel' | 'genre' | 'releaseDate';
type SortDir = 'asc' | 'desc';

export function Songs() {
  const { songs, connections, addSong, updateSong, deleteSong } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editSong, setEditSong] = useState<Song | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filtered = songs
    .filter((s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase()) ||
      s.genre.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const handleSave = (data: Omit<Song, 'id' | 'createdAt'>) => {
    if (editSong) {
      updateSong(editSong.id, data);
    } else {
      addSong({ ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    }
    setShowForm(false);
    setEditSong(null);
  };

  const energyColor = (level: number) =>
    level <= 3 ? 'text-energy-low' : level <= 7 ? 'text-energy-mid' : 'text-energy-high';

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 min-w-0 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Songs</h1>
            <p className="text-text-secondary text-sm">{songs.length} tracks in your collection</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border text-text-secondary rounded-lg hover:text-text-primary hover:border-accent/50 transition-colors"
            >
              <Upload size={16} /> Import ZIP
            </button>
            <button
              onClick={() => { setEditSong(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-accent to-accent-purple text-bg-primary rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={16} /> Add Song
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, artist, or genre..."
            className="w-full !pl-10 py-2.5"
          />
        </div>

        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-text-muted font-medium p-3 w-10"></th>
                <th onClick={() => handleSort('title')} className="text-left text-xs text-text-muted font-medium p-3 cursor-pointer hover:text-text-primary">
                  <span className="flex items-center gap-1">Title <SortIcon field="title" /></span>
                </th>
                <th onClick={() => handleSort('artist')} className="text-left text-xs text-text-muted font-medium p-3 cursor-pointer hover:text-text-primary">
                  <span className="flex items-center gap-1">Artist <SortIcon field="artist" /></span>
                </th>
                <th onClick={() => handleSort('bpm')} className="text-left text-xs text-text-muted font-medium p-3 cursor-pointer hover:text-text-primary w-20">
                  <span className="flex items-center gap-1">BPM <SortIcon field="bpm" /></span>
                </th>
                <th onClick={() => handleSort('key')} className="text-left text-xs text-text-muted font-medium p-3 cursor-pointer hover:text-text-primary w-16">
                  <span className="flex items-center gap-1">Key <SortIcon field="key" /></span>
                </th>
                <th className="text-left text-xs text-text-muted font-medium p-3 w-20">Duration</th>
                <th onClick={() => handleSort('energyLevel')} className="text-left text-xs text-text-muted font-medium p-3 cursor-pointer hover:text-text-primary w-20">
                  <span className="flex items-center gap-1">Energy <SortIcon field="energyLevel" /></span>
                </th>
                <th onClick={() => handleSort('genre')} className="text-left text-xs text-text-muted font-medium p-3 cursor-pointer hover:text-text-primary">
                  <span className="flex items-center gap-1">Genre <SortIcon field="genre" /></span>
                </th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-text-muted">
                    <Music size={32} className="mx-auto mb-2 opacity-40" />
                    {songs.length === 0 ? 'No songs yet. Add your first track!' : 'No songs match your search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((song) => {
                  const connCount = connections.filter(
                    (c) => c.fromSongId === song.id || c.toSongId === song.id
                  ).length;
                  return (
                    <tr
                      key={song.id}
                      onClick={() => setSelectedSong(selectedSong?.id === song.id ? null : song)}
                      className={`border-b border-border/50 hover:bg-bg-hover/50 transition-colors group cursor-pointer ${
                        selectedSong?.id === song.id ? 'bg-bg-hover/70' : ''
                      }`}
                    >
                      <td className="p-3">
                        {song.thumbnail ? (
                          <img src={song.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-bg-secondary flex items-center justify-center">
                            <Music size={12} className="text-text-muted" />
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-sm font-medium">
                        <span className="flex items-center gap-2">
                          {song.title}
                          {connCount > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-accent-purple">
                              <Link size={10} /> {connCount}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-text-secondary">{song.artist}</td>
                      <td className="p-3 text-sm font-mono text-text-secondary">{song.bpm || '-'}</td>
                      <td className="p-3 text-sm font-mono text-accent">{song.key || '-'}</td>
                      <td className="p-3 text-sm text-text-muted">{song.duration || '-'}</td>
                      <td className="p-3">
                        <span className={`text-sm font-mono font-medium ${energyColor(song.energyLevel)}`}>
                          {song.energyLevel}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-bg-secondary text-text-secondary border border-border">
                          {song.genre}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setEditSong(song); setShowForm(true); }} className="p-1.5 text-text-muted hover:text-accent rounded transition-colors">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteSong(song.id); }} className="p-1.5 text-text-muted hover:text-energy-high rounded transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side panel */}
      {selectedSong && (
        <div className="w-[380px] shrink-0 border-l-0">
          <SongDetailPanel
            song={selectedSong}
            onClose={() => setSelectedSong(null)}
            onEdit={(song) => { setEditSong(song); setShowForm(true); }}
            onSelectSong={setSelectedSong}
          />
        </div>
      )}

      {showForm && (
        <SongFormDialog
          song={editSong}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditSong(null); }}
        />
      )}

      {showImport && (
        <ZipImportDialog onClose={() => setShowImport(false)} />
      )}
    </div>
  );
}
