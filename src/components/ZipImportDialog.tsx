import { useState, useCallback } from 'react';
import {
  X, Upload, AlertTriangle, CheckCircle, Image,
  ChevronDown, ChevronUp, Music, Loader,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  parseZipImport, resolveConnections,
  type ImportSongPreview, type ImportResult, type ParseProgress,
} from '../utils/zipImporter';

type Step = 'upload' | 'parsing' | 'preview' | 'importing' | 'done';

interface Props {
  onClose: () => void;
}

export function ZipImportDialog({ onClose }: Props) {
  const { songs: existingSongs, addSongs, addConnections } = useStore();
  const [step, setStep] = useState<Step>('upload');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [importStats, setImportStats] = useState({ songs: 0, connections: 0, unresolved: 0 });
  const [parseProgress, setParseProgress] = useState<ParseProgress | null>(null);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, phase: '' });

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Please select a .zip file');
      return;
    }
    setError(null);
    setStep('parsing');
    setParseProgress(null);
    try {
      const res = await parseZipImport(file, (p) => setParseProgress(p));
      // Flag duplicates
      const existingTitles = new Set(existingSongs.map((s) => s.title.toLowerCase()));
      for (const song of res.songs) {
        if (existingTitles.has(song.title.toLowerCase())) {
          res.warnings.push(`Possible duplicate: "${song.title}" already exists`);
        }
      }
      setResult(res);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse ZIP');
      setStep('upload');
    }
  }, [existingSongs]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const toggleSong = (id: string) => {
    if (!result) return;
    setResult({
      ...result,
      songs: result.songs.map((s) =>
        s.id === id ? { ...s, selected: !s.selected } : s
      ),
    });
  };

  const updateSong = (id: string, field: keyof ImportSongPreview, value: string | number) => {
    if (!result) return;
    setResult({
      ...result,
      songs: result.songs.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  const handleImport = async () => {
    if (!result) return;
    setStep('importing');

    const selected = result.songs.filter((s) => s.selected);
    const total = selected.length;

    // Build all song objects
    setImportProgress({ current: 0, total, phase: 'Preparing songs...' });
    await new Promise((r) => setTimeout(r, 0));

    const songsToAdd = selected.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      bpm: s.bpm,
      key: s.key,
      genre: s.genre,
      energyLevel: s.energyLevel,
      duration: s.duration,
      releaseDate: s.releaseDate,
      recordLabel: s.recordLabel,
      notes: s.notes,
      youtubeUrl: s.youtubeUrl,
      thumbnail: s.thumbnail,
      createdAt: new Date().toISOString(),
    }));

    // Add all songs in one batch
    setImportProgress({ current: Math.floor(total / 2), total, phase: `Adding ${total} songs...` });
    await new Promise((r) => setTimeout(r, 0));
    await addSongs(songsToAdd);

    // Resolve connections
    setImportProgress({ current: total, total, phase: 'Resolving connections...' });
    await new Promise((r) => setTimeout(r, 0));

    const { connections: resolvedConns, unresolved } = resolveConnections(selected);

    if (resolvedConns.length > 0) {
      const connectionsToAdd = resolvedConns.map((conn) => ({
        id: crypto.randomUUID(),
        fromSongId: conn.fromSongId,
        toSongId: conn.toSongId,
        notes: '',
        createdAt: new Date().toISOString(),
      }));
      await addConnections(connectionsToAdd);
    }

    setImportStats({
      songs: selected.length,
      connections: resolvedConns.length,
      unresolved: unresolved.length,
    });
    setStep('done');
  };

  const selectedCount = result?.songs.filter((s) => s.selected).length ?? 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-bg-card border border-border rounded-xl w-full max-w-4xl mx-4 shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold">
            {step === 'upload' && 'Import Songs from ZIP'}
            {step === 'parsing' && 'Reading ZIP...'}
            {step === 'preview' && result && `Preview — ${result.songs.length} songs found`}
            {step === 'importing' && 'Importing...'}
            {step === 'done' && 'Import Complete'}
          </h3>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary rounded transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Upload step */}
          {step === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragOver ? 'border-accent bg-accent/5' : 'border-border'
              }`}
            >
              <Upload size={40} className="mx-auto mb-4 text-text-muted" />
              <p className="text-sm font-medium mb-1">Drag & drop your ZIP file here</p>
              <p className="text-xs text-text-muted mb-4">ZIP should contain a CSV file and an images/ folder</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-accent to-accent-purple text-bg-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
                <Upload size={14} /> Browse Files
                <input
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </label>
              {error && (
                <p className="mt-4 text-xs text-energy-high flex items-center justify-center gap-1">
                  <AlertTriangle size={12} /> {error}
                </p>
              )}
            </div>
          )}

          {/* Parsing progress */}
          {step === 'parsing' && (
            <div className="py-12 px-4">
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Loader size={20} className="animate-spin text-accent" />
                  <span className="text-sm font-medium">
                    {parseProgress?.phase === 'reading' && 'Opening ZIP...'}
                    {parseProgress?.phase === 'csv' && 'Parsing CSV...'}
                    {parseProgress?.phase === 'images' && 'Loading images...'}
                    {!parseProgress && 'Starting...'}
                  </span>
                </div>
                {parseProgress?.phase === 'images' && (
                  <>
                    <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-accent-purple rounded-full transition-all duration-150"
                        style={{ width: `${(parseProgress.current / parseProgress.total) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-text-muted">
                      <span className="truncate max-w-[280px]">{parseProgress.currentTitle}</span>
                      <span className="shrink-0 ml-2">{parseProgress.current} / {parseProgress.total}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Preview step */}
          {step === 'preview' && result && (
            <div className="space-y-4">
              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="bg-energy-mid/10 border border-energy-mid/30 rounded-lg p-3">
                  <p className="text-xs font-medium text-energy-mid flex items-center gap-1 mb-2">
                    <AlertTriangle size={12} /> {result.warnings.length} warning{result.warnings.length !== 1 ? 's' : ''}
                  </p>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {result.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-text-secondary">{w}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Song list */}
              <div className="space-y-1">
                {result.songs.map((song) => (
                  <div key={song.id} className="border border-border rounded-lg overflow-hidden">
                    {/* Song row */}
                    <div
                      className={`flex items-center gap-3 p-2.5 cursor-pointer hover:bg-bg-hover/50 transition-colors ${
                        !song.selected ? 'opacity-40' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={song.selected}
                        onChange={() => toggleSong(song.id)}
                        className="shrink-0 accent-accent"
                      />
                      <div className="w-8 h-8 shrink-0">
                        {song.thumbnail ? (
                          <img src={song.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-bg-secondary flex items-center justify-center">
                            {song.imageFound ? (
                              <Image size={12} className="text-text-muted" />
                            ) : (
                              <Music size={12} className="text-text-muted" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0" onClick={() => setExpandedId(expandedId === song.id ? null : song.id)}>
                        <p className="text-sm font-medium truncate">{song.title}</p>
                        <p className="text-xs text-text-secondary truncate">{song.artist}</p>
                      </div>
                      <span className="text-xs text-text-muted font-mono shrink-0">{song.bpm || '-'}</span>
                      <span className="text-xs text-accent font-mono shrink-0 w-8">{song.key || '-'}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-bg-secondary text-text-secondary shrink-0">{song.genre}</span>
                      {(song.mixInTitles.length > 0 || song.mixOutTitles.length > 0) && (
                        <span className="text-xs text-accent-purple shrink-0">
                          {song.mixInTitles.length + song.mixOutTitles.length} conn
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedId(expandedId === song.id ? null : song.id)}
                        className="p-1 text-text-muted hover:text-text-primary shrink-0"
                      >
                        {expandedId === song.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {/* Expanded edit form */}
                    {expandedId === song.id && (
                      <div className="border-t border-border bg-bg-secondary/30 p-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-text-muted block mb-1">Title</label>
                            <input
                              value={song.title}
                              onChange={(e) => updateSong(song.id, 'title', e.target.value)}
                              className="w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-muted block mb-1">Artist</label>
                            <input
                              value={song.artist}
                              onChange={(e) => updateSong(song.id, 'artist', e.target.value)}
                              className="w-full text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-text-muted block mb-1">BPM</label>
                            <input
                              type="number"
                              value={song.bpm ?? ''}
                              onChange={(e) => updateSong(song.id, 'bpm', e.target.value ? parseInt(e.target.value) : '')}
                              className="w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-muted block mb-1">Key</label>
                            <input
                              value={song.key}
                              onChange={(e) => updateSong(song.id, 'key', e.target.value)}
                              className="w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-muted block mb-1">Genre</label>
                            <input
                              value={song.genre}
                              onChange={(e) => updateSong(song.id, 'genre', e.target.value)}
                              className="w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-muted block mb-1">Energy (1-10)</label>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={song.energyLevel}
                              onChange={(e) => updateSong(song.id, 'energyLevel', parseInt(e.target.value) || 5)}
                              className="w-full text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-text-muted block mb-1">Duration</label>
                            <input
                              value={song.duration}
                              onChange={(e) => updateSong(song.id, 'duration', e.target.value)}
                              className="w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-muted block mb-1">Release Date</label>
                            <input
                              value={song.releaseDate}
                              onChange={(e) => updateSong(song.id, 'releaseDate', e.target.value)}
                              className="w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-muted block mb-1">Record Label</label>
                            <input
                              value={song.recordLabel}
                              onChange={(e) => updateSong(song.id, 'recordLabel', e.target.value)}
                              className="w-full text-sm"
                            />
                          </div>
                        </div>
                        {(song.mixInTitles.length > 0 || song.mixOutTitles.length > 0) && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-text-muted block mb-1">Mix In ({song.mixInTitles.length})</label>
                              <div className="text-xs text-text-secondary space-y-0.5">
                                {song.mixInTitles.map((t, i) => (
                                  <p key={i} className="truncate">← {t}</p>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-text-muted block mb-1">Mix Out ({song.mixOutTitles.length})</label>
                              <div className="text-xs text-text-secondary space-y-0.5">
                                {song.mixOutTitles.map((t, i) => (
                                  <p key={i} className="truncate">→ {t}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Importing progress */}
          {step === 'importing' && (
            <div className="py-12 px-4">
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Loader size={20} className="animate-spin text-accent" />
                  <span className="text-sm font-medium">Importing...</span>
                </div>
                <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent-purple rounded-full transition-all duration-150"
                    style={{ width: `${importProgress.total ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span className="truncate max-w-[280px]">{importProgress.phase}</span>
                  <span className="shrink-0 ml-2">{importProgress.current} / {importProgress.total}</span>
                </div>
              </div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="text-center py-12">
              <CheckCircle size={40} className="mx-auto mb-4 text-energy-low" />
              <p className="text-lg font-semibold mb-2">Import Complete</p>
              <div className="space-y-1 text-sm text-text-secondary">
                <p>{importStats.songs} songs imported</p>
                <p>{importStats.connections} connections created</p>
                {importStats.unresolved > 0 && (
                  <p className="text-energy-mid">{importStats.unresolved} connections could not be resolved</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border shrink-0">
          {step === 'preview' && result && (
            <>
              <p className="text-xs text-text-muted">
                {selectedCount} of {result.songs.length} selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setStep('upload'); setResult(null); }}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-accent to-accent-purple text-bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Import {selectedCount} Songs
                </button>
              </div>
            </>
          )}
          {step === 'done' && (
            <div className="ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-accent to-accent-purple text-bg-primary rounded-lg hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          )}
          {(step === 'upload' || step === 'importing' || step === 'parsing') && <div />}
        </div>
      </div>
    </div>
  );
}
