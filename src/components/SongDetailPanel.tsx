import { useState } from 'react';
import {
  X, Plus, ArrowRight, ArrowLeft, Trash2, Music, Link,
  Edit3, Clock, Disc3, Tag, Zap, Calendar, Building2, Play,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { ConnectSongDialog } from './ConnectSongDialog';
import type { Song } from '../types';

interface Props {
  song: Song;
  onClose: () => void;
  onEdit: (song: Song) => void;
  onSelectSong: (song: Song) => void;
}

export function SongDetailPanel({ song, onClose, onEdit, onSelectSong }: Props) {
  const { songs, connections, addConnection, deleteConnection } = useStore();
  const [showConnect, setShowConnect] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);

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

  const energyColor = (level: number) =>
    level <= 3 ? 'bg-energy-low' : level <= 7 ? 'bg-energy-mid' : 'bg-energy-high';

  const energyTextColor = (level: number) =>
    level <= 3 ? 'text-energy-low' : level <= 7 ? 'text-energy-mid' : 'text-energy-high';

  const ConnectedSong = ({ connSong, connectionId }: {
    connSong: Song;
    connectionId: string;
  }) => {
    const [confirming, setConfirming] = useState(false);

    return (
      <div
        onClick={() => !confirming && onSelectSong(connSong)}
        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-bg-hover/50 group transition-colors cursor-pointer"
      >
        {connSong.thumbnail ? (
          <img src={connSong.thumbnail} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded bg-bg-secondary flex items-center justify-center shrink-0">
            <Music size={12} className="text-text-muted" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{connSong.title}</p>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="truncate">{connSong.artist}</span>
            {connSong.bpm && <span className="font-mono shrink-0">{connSong.bpm}</span>}
            {connSong.key && <span className="font-mono text-accent shrink-0">{connSong.key}</span>}
          </div>
        </div>
        {confirming ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); deleteConnection(connectionId); }}
              className="px-2 py-0.5 text-[10px] font-medium text-energy-high bg-energy-high/10 rounded hover:bg-energy-high/20 transition-colors"
            >
              Remove
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
              className="px-2 py-0.5 text-[10px] font-medium text-text-muted hover:text-text-primary rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            className="p-1 text-text-muted hover:text-energy-high rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full bg-bg-secondary border-l border-border">
        {/* Header with thumbnail */}
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(song)}
                className="p-1.5 text-text-muted hover:text-accent rounded transition-colors"
                title="Edit song"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => setShowConnect(true)}
                className="p-1.5 text-text-muted hover:text-accent-purple rounded transition-colors"
                title="Add connection"
              >
                <Plus size={14} />
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Song identity */}
          <div className="flex items-center gap-3">
            {song.thumbnail ? (
              <img src={song.thumbnail} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-bg-card flex items-center justify-center shrink-0">
                <Music size={20} className="text-text-muted" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold leading-tight truncate" title={song.title}>{song.title}</h2>
              <p className="text-xs text-text-secondary truncate mt-0.5">{song.artist}</p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Metadata */}
          <div className="p-4 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <MetaItem icon={Zap} label="BPM" value={song.bpm ? `${song.bpm}` : '-'} />
              <MetaItem icon={Disc3} label="Key" value={song.key || '-'} accent />
              <MetaItem icon={Clock} label="Duration" value={song.duration || '-'} />
              <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-card">
                <Zap size={12} className="text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-muted leading-none mb-1">Energy</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-mono font-medium ${energyTextColor(song.energyLevel)}`}>
                      {song.energyLevel}
                    </span>
                    <div className="flex-1 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${energyColor(song.energyLevel)}`}
                        style={{ width: `${song.energyLevel * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MetaItem icon={Tag} label="Genre" value={song.genre || '-'} />
              <MetaItem icon={Building2} label="Label" value={song.recordLabel || '-'} />
              <MetaItem icon={Calendar} label="Released" value={song.releaseDate || '-'} />
              {song.youtubeUrl ? (
                <div
                  onClick={() => setShowYoutube(true)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-bg-card hover:bg-bg-hover/50 cursor-pointer transition-colors"
                >
                  <Play size={12} className="text-energy-high shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-text-muted leading-none mb-0.5">YouTube</p>
                    <p className="text-xs font-medium text-accent truncate">Watch</p>
                  </div>
                </div>
              ) : (
                <MetaItem icon={Play} label="YouTube" value="-" />
              )}
            </div>
          </div>

          {/* Connections */}
          <div className="border-t border-border">
            {/* Mix Out */}
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2 flex items-center gap-1.5">
                <ArrowRight size={10} className="text-accent" />
                Mix Out
                <span className="text-text-muted/50 normal-case tracking-normal font-normal">({mixOuts.length})</span>
              </h3>
              {mixOuts.length === 0 ? (
                <p className="text-xs text-text-muted/40 py-1">No mix-out connections</p>
              ) : (
                <div className="space-y-0.5">
                  {mixOuts.map((x) => (
                    <ConnectedSong
                      key={x.connection.id}
                      connSong={x.song!}
                      connectionId={x.connection.id}
                      direction="out"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Mix In */}
            <div className="px-4 pt-2 pb-4">
              <h3 className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2 flex items-center gap-1.5">
                <ArrowLeft size={10} className="text-accent-purple" />
                Mix In
                <span className="text-text-muted/50 normal-case tracking-normal font-normal">({mixIns.length})</span>
              </h3>
              {mixIns.length === 0 ? (
                <p className="text-xs text-text-muted/40 py-1">No mix-in connections</p>
              ) : (
                <div className="space-y-0.5">
                  {mixIns.map((x) => (
                    <ConnectedSong
                      key={x.connection.id}
                      connSong={x.song!}
                      connectionId={x.connection.id}
                      direction="in"
                    />
                  ))}
                </div>
              )}
            </div>

            {mixOuts.length === 0 && mixIns.length === 0 && (
              <div className="text-center py-6 px-4">
                <Link size={20} className="mx-auto mb-2 text-text-muted/20" />
                <p className="text-xs text-text-muted/40">No connections yet</p>
                <button
                  onClick={() => setShowConnect(true)}
                  className="mt-2 text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  + Add connection
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          {song.notes && (
            <div className="border-t border-border px-4 py-4">
              <h3 className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">Notes</h3>
              <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">{song.notes}</p>
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

      {showYoutube && song.youtubeUrl && (
        <YoutubePlayerDialog url={song.youtubeUrl} onClose={() => setShowYoutube(false)} />
      )}
    </>
  );
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function YoutubePlayerDialog({ url, onClose }: { url: string; onClose: () => void }) {
  const videoId = extractYoutubeId(url);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <Play size={12} className="text-energy-high" /> YouTube
          </span>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary rounded transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="p-3">
          {videoId ? (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-8">Could not load video from URL</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaItem({ icon: Icon, label, value, accent }: {
  icon: typeof Clock;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-card">
      <Icon size={12} className="text-text-muted shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-text-muted leading-none mb-0.5">{label}</p>
        <p className={`text-xs font-medium truncate ${accent ? 'text-accent' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
