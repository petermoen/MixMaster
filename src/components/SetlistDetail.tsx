import { useState } from 'react';
import { ArrowLeft, Plus, GripVertical, Trash2, Music } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store/useStore';
import type { Setlist, Song } from '../types';

interface Props {
  setlist: Setlist;
  onBack: () => void;
}

function SortableSongRow({ song, position, onRemove }: { song: Song; position: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: song.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg border border-border group">
      <button {...attributes} {...listeners} className="text-text-muted hover:text-text-primary cursor-grab active:cursor-grabbing">
        <GripVertical size={16} />
      </button>
      <span className="text-xs text-text-muted w-6 text-center font-mono">{position + 1}</span>
      {song.thumbnail ? (
        <img src={song.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
      ) : (
        <div className="w-10 h-10 rounded bg-bg-card flex items-center justify-center">
          <Music size={14} className="text-text-muted" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{song.title}</p>
        <p className="text-xs text-text-secondary truncate">{song.artist}</p>
      </div>
      <span className="text-xs text-text-muted font-mono">{song.bpm ? `${song.bpm} BPM` : ''}</span>
      <span className="text-xs text-accent font-mono">{song.key}</span>
      <span className="text-xs text-text-muted">{song.duration}</span>
      <button onClick={onRemove} className="text-text-muted hover:text-energy-high opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function SetlistDetail({ setlist, onBack }: Props) {
  const { songs, addSongToSetlist, removeSongFromSetlist, reorderSetlistSongs } = useStore();
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const setlistSongs = setlist.songs
    .sort((a, b) => a.position - b.position)
    .map((s) => songs.find((song) => song.id === s.songId))
    .filter(Boolean) as Song[];

  const availableSongs = songs.filter(
    (s) => !setlist.songs.some((ss) => ss.songId === s.id) &&
      (s.title.toLowerCase().includes(search.toLowerCase()) || s.artist.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = setlistSongs.findIndex((s) => s.id === active.id);
    const newIndex = setlistSongs.findIndex((s) => s.id === over.id);
    const reordered = [...setlistSongs];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    reorderSetlistSongs(
      setlist.id,
      reordered.map((s, i) => ({ songId: s.id, position: i }))
    );
  };

  const totalDuration = setlistSongs.reduce((acc, s) => {
    if (!s.duration) return acc;
    const parts = s.duration.split(':');
    return acc + parseInt(parts[0]) * 60 + parseInt(parts[1] || '0');
  }, 0);
  const hours = Math.floor(totalDuration / 3600);
  const mins = Math.floor((totalDuration % 3600) / 60);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-accent mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Setlists
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">{setlist.title}</h1>
          <p className="text-text-secondary text-sm">
            {setlist.date} &middot; {setlistSongs.length} tracks
            {totalDuration > 0 && ` \u00b7 ${hours > 0 ? `${hours}h ` : ''}${mins}m`}
          </p>
          {setlist.notes && <p className="text-text-muted text-sm mt-2">{setlist.notes}</p>}
        </div>
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-colors"
        >
          <Plus size={16} /> Add Song
        </button>
      </div>

      {setlistSongs.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Music size={40} className="mx-auto mb-3 opacity-40" />
          <p>No tracks in this setlist yet</p>
          <p className="text-sm mt-1">Click "Add Song" to start building your set</p>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={setlistSongs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {setlistSongs.map((song, i) => (
                <SortableSongRow
                  key={song.id}
                  song={song}
                  position={i}
                  onRemove={() => removeSongFromSetlist(setlist.id, song.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-lg max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold mb-3">Add Songs to Setlist</h3>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search songs..."
                className="w-full"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {availableSongs.length === 0 ? (
                <p className="text-center text-text-muted py-8 text-sm">No songs available</p>
              ) : (
                availableSongs.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => {
                      addSongToSetlist(setlist.id, song.id);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover text-left transition-colors"
                  >
                    {song.thumbnail ? (
                      <img src={song.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-bg-secondary flex items-center justify-center">
                        <Music size={12} className="text-text-muted" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <p className="text-xs text-text-secondary">{song.artist}</p>
                    </div>
                    <span className="text-xs text-text-muted">{song.bpm} BPM</span>
                    <Plus size={14} className="text-accent" />
                  </button>
                ))
              )}
            </div>
            <div className="p-3 border-t border-border">
              <button onClick={() => setShowPicker(false)} className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
