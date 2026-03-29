import { useState } from 'react';
import { Plus, Trash2, ListMusic, Calendar, Music } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SetlistDetail } from '../components/SetlistDetail';
import type { Setlist } from '../types';

export function Setlists() {
  const { setlists, songs, addSetlist, deleteSetlist } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const selected = setlists.find((s) => s.id === selectedId);

  if (selected) {
    return <SetlistDetail setlist={selected} onBack={() => setSelectedId(null)} />;
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addSetlist({
      id: crypto.randomUUID(),
      title: title.trim(),
      date,
      notes,
      songs: [],
      createdAt: new Date().toISOString(),
    });
    setTitle('');
    setDate('');
    setNotes('');
    setShowCreate(false);
  };

  return (
    <div className="p-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Setlists</h1>
          <p className="text-text-secondary text-sm">{setlists.length} setlists created</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-accent-purple to-accent-pink text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> New Setlist
        </button>
      </div>

      {setlists.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <ListMusic size={40} className="mx-auto mb-3 opacity-40" />
          <p>No setlists yet</p>
          <p className="text-sm mt-1">Create your first setlist to start organizing your tracks</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {setlists.map((setlist) => {
            const trackCount = setlist.songs.length;
            const setlistSongs = setlist.songs
              .map((s) => songs.find((song) => song.id === s.songId))
              .filter(Boolean);

            return (
              <div
                key={setlist.id}
                onClick={() => setSelectedId(setlist.id)}
                className="bg-bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-accent/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                    <ListMusic size={18} className="text-white" />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSetlist(setlist.id); }}
                    className="text-text-muted hover:text-energy-high opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3 className="font-semibold mb-1">{setlist.title}</h3>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  {setlist.date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> {setlist.date}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Music size={10} /> {trackCount} tracks
                  </span>
                </div>
                {setlistSongs.length > 0 && (
                  <div className="mt-3 flex -space-x-1">
                    {setlistSongs.slice(0, 5).map((song) => (
                      song?.thumbnail ? (
                        <img key={song.id} src={song.thumbnail} alt="" className="w-6 h-6 rounded-full object-cover border-2 border-bg-card" />
                      ) : (
                        <div key={song?.id} className="w-6 h-6 rounded-full bg-bg-secondary border-2 border-bg-card flex items-center justify-center">
                          <Music size={8} className="text-text-muted" />
                        </div>
                      )
                    ))}
                    {trackCount > 5 && (
                      <div className="w-6 h-6 rounded-full bg-bg-secondary border-2 border-bg-card flex items-center justify-center">
                        <span className="text-[8px] text-text-muted">+{trackCount - 5}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold">New Setlist</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Friday Night Set" className="w-full" required autoFocus />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Venue, theme, etc." rows={3} className="w-full resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-accent-purple to-accent-pink text-white rounded-lg hover:opacity-90 transition-opacity">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
