import { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { metadataApi, type BeatportTrack } from '../api/client';

interface Props {
  onSelect: (track: BeatportTrack) => void;
}

export function BeatportSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BeatportTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const handle = setTimeout(async () => {
      try {
        const data = await metadataApi.search(query.trim());
        setResults(data);
        setOpen(true);
      } catch {
        setError('Beatport-zoekopdracht mislukt — vul handmatig in');
        setResults([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleSelect = (track: BeatportTrack) => {
    onSelect(track);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border rounded-lg focus-within:border-accent/50">
        <Search size={16} className="text-text-muted shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Zoek op Beatport om velden automatisch te vullen…"
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-text-muted"
        />
        {loading && <Loader2 size={14} className="animate-spin text-text-muted shrink-0" />}
      </div>

      {open && (error || results.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-bg-card border border-border rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {error ? (
            <div className="p-3 text-xs text-energy-low">{error}</div>
          ) : (
            results.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => handleSelect(t)}
                className="w-full flex items-center gap-3 p-2 hover:bg-bg-secondary text-left transition-colors border-b border-border last:border-b-0"
              >
                <div className="w-10 h-10 rounded bg-bg-secondary overflow-hidden shrink-0">
                  {t.artworkUrl && (
                    <img
                      src={t.artworkUrl.replace(/image_size\/\d+x\d+/, 'image_size/100x100')}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    {t.title}
                    {t.mixName && t.mixName !== 'Original Mix' && (
                      <span className="text-text-muted"> ({t.mixName})</span>
                    )}
                  </div>
                  <div className="text-xs text-text-muted truncate">
                    {t.artists.join(', ')}
                    {t.label && <span className="opacity-60"> · {t.label}</span>}
                    {t.bpm != null && <span className="opacity-60"> · {t.bpm} BPM</span>}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
