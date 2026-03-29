import { useState, useRef } from 'react';
import { X, Upload, Image } from 'lucide-react';
import type { Song } from '../types';

interface Props {
  song?: Song | null;
  onSave: (data: Omit<Song, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const KEYS = ['Am', 'A', 'Bbm', 'Bb', 'Bm', 'B', 'Cm', 'C', 'C#m', 'Db', 'Dm', 'D', 'Ebm', 'Eb', 'Em', 'E', 'Fm', 'F', 'F#m', 'F#', 'Gm', 'G', 'G#m', 'Ab'];
const GENRES = ['Trance', 'Progressive Trance', 'Uplifting Trance', 'Psytrance', 'Tech Trance', 'Vocal Trance', 'Techno', 'Progressive House', 'Deep House', 'Melodic Techno'];
const ENERGY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function SongFormDialog({ song, onSave, onClose }: Props) {
  const [title, setTitle] = useState(song?.title ?? '');
  const [artist, setArtist] = useState(song?.artist ?? '');
  const [bpm, setBpm] = useState(song?.bpm?.toString() ?? '');
  const [key, setKey] = useState(song?.key ?? '');
  const [duration, setDuration] = useState(song?.duration ?? '');
  const [releaseDate, setReleaseDate] = useState(song?.releaseDate ?? '');
  const [energyLevel, setEnergyLevel] = useState(song?.energyLevel ?? 5);
  const [genre, setGenre] = useState(song?.genre ?? 'Trance');
  const [recordLabel, setRecordLabel] = useState(song?.recordLabel ?? '');
  const [notes, setNotes] = useState(song?.notes ?? '');
  const [thumbnail, setThumbnail] = useState<string | null>(song?.thumbnail ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setThumbnail(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;
    onSave({
      title: title.trim(),
      artist: artist.trim(),
      bpm: bpm ? parseInt(bpm) : null,
      key,
      duration,
      releaseDate,
      energyLevel,
      genre,
      recordLabel,
      notes,
      thumbnail,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">{song ? 'Edit Song' : 'Add Song'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-accent/50 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden shrink-0"
            >
              {thumbnail ? (
                <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Image size={20} className="text-text-muted mb-1" />
                  <span className="text-[10px] text-text-muted">Cover</span>
                </>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Track title" className="w-full" required />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Artist *</label>
                <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist name" className="w-full" required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1">BPM</label>
              <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="138" min="60" max="200" className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Key</label>
              <select value={key} onChange={(e) => setKey(e.target.value)} className="w-full">
                <option value="">Select key</option>
                {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Duration</label>
              <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="7:30" className="w-full" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Release Date</label>
              <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Genre</label>
              <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full">
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Record Label</label>
              <input value={recordLabel} onChange={(e) => setRecordLabel(e.target.value)} placeholder="Label name" className="w-full" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-2">Energy Level: {energyLevel}</label>
            <div className="flex gap-1">
              {ENERGY_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEnergyLevel(level)}
                  className={`flex-1 h-8 rounded text-xs font-medium transition-all ${
                    level <= energyLevel
                      ? level <= 3 ? 'bg-energy-low/20 text-energy-low border border-energy-low/30'
                        : level <= 7 ? 'bg-energy-mid/20 text-energy-mid border border-energy-mid/30'
                        : 'bg-energy-high/20 text-energy-high border border-energy-high/30'
                      : 'bg-bg-secondary text-text-muted border border-border'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mix notes, cue points, etc." rows={3} className="w-full resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-accent to-accent-purple text-bg-primary rounded-lg hover:opacity-90 transition-opacity"
            >
              {song ? 'Update' : 'Add Song'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
