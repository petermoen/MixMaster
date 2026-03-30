import { X, Music, Clock, Disc3, Tag, Zap, Calendar, Building2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Song, SetlistSong } from '../types';

interface Props {
  song: Song;
  setlistSong: SetlistSong;
  setlistId: string;
  onClose: () => void;
}

export function SetlistSongPanel({ song, setlistSong, setlistId, onClose }: Props) {
  const { updateSetlistSong } = useStore();

  const handleChange = (field: 'cueIn' | 'cueOut' | 'notes', value: string) => {
    updateSetlistSong(setlistId, song.id, { [field]: value });
  };

  const energyColor = (level: number) =>
    level <= 3 ? 'bg-energy-low' : level <= 7 ? 'bg-energy-mid' : 'bg-energy-high';

  const energyTextColor = (level: number) =>
    level <= 3 ? 'text-energy-low' : level <= 7 ? 'text-energy-mid' : 'text-energy-high';

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-accent-purple">
            #{setlistSong.position + 1} in setlist
          </span>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors">
            <X size={14} />
          </button>
        </div>

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
        {/* Cue points */}
        <div className="p-4 space-y-3">
          <h3 className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Cue Points</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-text-muted mb-1">Cue In</label>
              <input
                value={setlistSong.cueIn || ''}
                onChange={(e) => handleChange('cueIn', e.target.value)}
                placeholder="e.g. A"
                className="w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-muted mb-1">Cue Out</label>
              <input
                value={setlistSong.cueOut || ''}
                onChange={(e) => handleChange('cueOut', e.target.value)}
                placeholder="e.g. B"
                className="w-full text-sm"
              />
            </div>
          </div>
        </div>

        {/* Transition notes */}
        <div className="px-4 pb-4">
          <h3 className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">Transition Notes</h3>
          <textarea
            value={setlistSong.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Mix notes, transition details..."
            rows={3}
            className="w-full text-sm resize-none"
          />
        </div>

        {/* Song metadata (read-only) */}
        <div className="border-t border-border p-4 space-y-2.5">
          <h3 className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Song Info</h3>
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
            <MetaItem icon={Tag} label="Genre" value={song.genre || '-'} />
            <MetaItem icon={Building2} label="Label" value={song.recordLabel || '-'} />
            <MetaItem icon={Calendar} label="Released" value={song.releaseDate || '-'} />
          </div>
        </div>

        {/* Song notes (if any) */}
        {song.notes && (
          <div className="border-t border-border px-4 py-4">
            <h3 className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-2">Song Notes</h3>
            <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">{song.notes}</p>
          </div>
        )}
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
