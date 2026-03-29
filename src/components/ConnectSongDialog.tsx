import { useState } from 'react';
import { Search, X, ArrowRight, ArrowLeft, Music } from 'lucide-react';
import type { Song } from '../types';

interface Props {
  song: Song;
  songs: Song[];
  existingConnectedIds: Set<string>;
  onConnect: (targetSongId: string, direction: 'out' | 'in') => void;
  onClose: () => void;
}

export function ConnectSongDialog({ song, songs, existingConnectedIds, onConnect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState<'out' | 'in'>('out');

  const available = songs.filter(
    (s) =>
      s.id !== song.id &&
      !existingConnectedIds.has(s.id) &&
      (s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-bg-card border border-border rounded-xl w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold">Connect Song</h3>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary rounded transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setDirection('out')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                direction === 'out'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              <ArrowRight size={14} /> Mix Out
            </button>
            <button
              onClick={() => setDirection('in')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                direction === 'in'
                  ? 'border-accent-purple bg-accent-purple/10 text-accent-purple'
                  : 'border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              <ArrowLeft size={14} /> Mix In
            </button>
          </div>

          <p className="text-xs text-text-muted text-center">
            {direction === 'out'
              ? `${song.title} mixes into →`
              : `← mixes into ${song.title}`}
          </p>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search songs..."
              className="w-full !pl-9 py-2"
              autoFocus
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1">
            {available.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-6">
                {search ? 'No matching songs' : 'No songs available'}
              </p>
            ) : (
              available.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onConnect(s.id, direction)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-bg-hover transition-colors text-left"
                >
                  {s.thumbnail ? (
                    <img src={s.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-bg-secondary flex items-center justify-center">
                      <Music size={12} className="text-text-muted" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-xs text-text-secondary">{s.artist}</p>
                  </div>
                  <div className="text-xs text-text-muted font-mono">
                    {s.bpm || ''}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
