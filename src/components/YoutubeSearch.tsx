import { useEffect, useRef, useState } from 'react';
import { Loader2, Play, ChevronDown } from 'lucide-react';
import { metadataApi, type YoutubeVideo } from '../api/client';

interface Props {
  artist: string;
  title: string;
  value: string;
  onChange: (url: string) => void;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function videoIdFromUrl(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function YoutubeSearch({ artist, title, value, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<YoutubeVideo[]>([]);
  const [selected, setSelected] = useState<YoutubeVideo | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const disabled = artist.trim() === '' || title.trim() === '' || loading;

  // Drop the preview strip when the URL no longer matches the picked video
  // (e.g. user pasted/typed something else).
  useEffect(() => {
    if (selected && videoIdFromUrl(value) !== selected.videoId) {
      setSelected(null);
      setPickerOpen(false);
    }
  }, [value, selected]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPickerOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await metadataApi.youtube(`${artist} ${title}`.trim());
      setResults(data);
      const first = data[0];
      if (first) {
        onChange(first.url);
        setSelected(first);
      } else {
        setError('Geen resultaten gevonden');
      }
    } catch {
      setError('YouTube niet bereikbaar');
    } finally {
      setLoading(false);
    }
  };

  const handlePick = (video: YoutubeVideo) => {
    onChange(video.url);
    setSelected(video);
    setPickerOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={handleSearch}
          disabled={disabled}
          title={
            artist.trim() === '' || title.trim() === ''
              ? 'Vul eerst artist en title in'
              : 'Zoek de eerste hit op YouTube'
          }
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-secondary border border-border rounded-lg hover:border-accent/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} className="text-energy-high" />
          )}
          Zoek op YouTube
        </button>

        {selected && (
          <div className="flex-1 min-w-0 flex items-center gap-2.5 p-1.5 bg-bg-secondary/50 border border-border rounded-lg">
            {selected.thumbnailUrl && (
              <img
                src={selected.thumbnailUrl}
                alt=""
                className="w-[60px] h-[34px] object-cover rounded shrink-0"
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0 leading-tight">
              <div className="text-xs truncate">{selected.title}</div>
              <div className="text-[10px] text-text-muted truncate">
                {selected.channel}
                {selected.durationSeconds != null && (
                  <span className="opacity-70"> · {formatDuration(selected.durationSeconds)}</span>
                )}
              </div>
            </div>
            {results.length > 1 && (
              <button
                type="button"
                onClick={() => setPickerOpen((o) => !o)}
                className="shrink-0 inline-flex items-center gap-0.5 text-[10px] text-text-secondary hover:text-text-primary px-1.5 py-1 rounded transition-colors"
              >
                Andere kiezen
                <ChevronDown size={10} />
              </button>
            )}
          </div>
        )}

        {!selected && error && (
          <div className="flex-1 text-xs text-energy-low self-center">{error}</div>
        )}
      </div>

      {pickerOpen && results.length > 0 && (
        <div className="absolute right-0 top-full mt-1 z-10 w-full max-w-md bg-bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          {results.map((v) => (
            <button
              type="button"
              key={v.videoId}
              onClick={() => handlePick(v)}
              className={`w-full flex items-center gap-2.5 p-2 text-left hover:bg-bg-secondary border-b border-border last:border-b-0 transition-colors ${
                selected?.videoId === v.videoId ? 'bg-bg-secondary/60' : ''
              }`}
            >
              {v.thumbnailUrl && (
                <img
                  src={v.thumbnailUrl}
                  alt=""
                  className="w-[60px] h-[34px] object-cover rounded shrink-0"
                  loading="lazy"
                />
              )}
              <div className="flex-1 min-w-0 leading-tight">
                <div className="text-xs truncate">{v.title}</div>
                <div className="text-[10px] text-text-muted truncate">
                  {v.channel}
                  {v.durationSeconds != null && (
                    <span className="opacity-70"> · {formatDuration(v.durationSeconds)}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
