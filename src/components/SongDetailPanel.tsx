import { useState } from 'react';
import { X, Plus, ArrowRight, ArrowLeft, Trash2, Music, Link } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ConnectSongDialog } from './ConnectSongDialog';
import type { Song } from '../types';

interface Props {
  song: Song;
  onClose: () => void;
}

export function SongDetailPanel({ song, onClose }: Props) {
  const { songs, connections, addConnection, deleteConnection } = useStore();
  const [showConnect, setShowConnect] = useState(false);

  const mixOuts = connections
    .filter((c) => c.fromSongId === song.id)
    .map((c) => ({ connection: c, song: songs.find((s) => s.id === c.toSongId) }))
    .filter((x) => x.song);

  const mixIns = connections
    .filter((c) => c.toSongId === song.id)
    .map((c) => ({ connection: c, song: songs.find((s) => s.id === c.fromSongId) }))
    .filter((x) => x.song);

  const existingConnectedIds = new Set([
    ...mixOuts.map((x) => x.song!.id),
    ...mixIns.map((x) => x.song!.id),
  ]);

  const handleConnect = (targetSongId: string, direction: 'out' | 'in') => {
    addConnection({
      id: crypto.randomUUID(),
      fromSongId: direction === 'out' ? song.id : targetSongId,
      toSongId: direction === 'out' ? targetSongId : song.id,
      notes: '',
      createdAt: new Date().toISOString(),
    });
    setShowConnect(false);
  };

  const SongRow = ({ connSong, connectionId, icon: Icon, color }: {
    connSong: Song;
    connectionId: string;
    icon: typeof ArrowRight;
    color: string;
  }) => (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-hover/50 group transition-colors">
      <Icon size={14} className={color} />
      {connSong.thumbnail ? (
        <img src={connSong.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
      ) : (
        <div className="w-8 h-8 rounded bg-bg-secondary flex items-center justify-center">
          <Music size={12} className="text-text-muted" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{connSong.title}</p>
        <p className="text-xs text-text-secondary">{connSong.artist}</p>
      </div>
      <span className="text-xs text-text-muted font-mono">{connSong.bpm || ''}</span>
      <span className="text-xs font-mono text-accent">{connSong.key || ''}</span>
      <button
        onClick={() => deleteConnection(connectionId)}
        className="p-1 text-text-muted hover:text-energy-high rounded opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );

  return (
    <>
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {song.thumbnail ? (
              <img src={song.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded bg-bg-secondary flex items-center justify-center">
                <Music size={16} className="text-text-muted" />
              </div>
            )}
            <div>
              <h2 className="text-sm font-semibold">{song.title}</h2>
              <p className="text-xs text-text-secondary">{song.artist} · {song.bpm || '?'} BPM · {song.key || '?'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConnect(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-accent to-accent-purple text-bg-primary rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={14} /> Connect
            </button>
            <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-1.5">
              <ArrowRight size={12} className="text-accent" /> Mix Out
              <span className="text-text-muted/60">({mixOuts.length})</span>
            </h3>
            {mixOuts.length === 0 ? (
              <p className="text-xs text-text-muted/60 pl-6 py-2">No mix-out connections yet</p>
            ) : (
              <div className="space-y-0.5">
                {mixOuts.map((x) => (
                  <SongRow key={x.connection.id} connSong={x.song!} connectionId={x.connection.id} icon={ArrowRight} color="text-accent" />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border/50" />

          <div>
            <h3 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-1.5">
              <ArrowLeft size={12} className="text-accent-purple" /> Mix In
              <span className="text-text-muted/60">({mixIns.length})</span>
            </h3>
            {mixIns.length === 0 ? (
              <p className="text-xs text-text-muted/60 pl-6 py-2">No mix-in connections yet</p>
            ) : (
              <div className="space-y-0.5">
                {mixIns.map((x) => (
                  <SongRow key={x.connection.id} connSong={x.song!} connectionId={x.connection.id} icon={ArrowLeft} color="text-accent-purple" />
                ))}
              </div>
            )}
          </div>

          {mixOuts.length === 0 && mixIns.length === 0 && (
            <div className="text-center py-4">
              <Link size={24} className="mx-auto mb-2 text-text-muted/30" />
              <p className="text-xs text-text-muted">Click "Connect" to link this song to others</p>
            </div>
          )}
        </div>
      </div>

      {showConnect && (
        <ConnectSongDialog
          song={song}
          songs={songs}
          existingConnectedIds={existingConnectedIds}
          onConnect={handleConnect}
          onClose={() => setShowConnect(false)}
        />
      )}
    </>
  );
}
