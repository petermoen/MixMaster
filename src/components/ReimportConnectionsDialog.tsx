import { useState, useCallback } from 'react';
import { X, Upload, CheckCircle, AlertTriangle, Loader, Link } from 'lucide-react';
import JSZip from 'jszip';
import { useStore } from '../store/useStore';
import { parseCSV } from '../utils/csvParser';

interface Props {
  onClose: () => void;
}

export function ReimportConnectionsDialog({ onClose }: Props) {
  const { songs, connections, addConnection } = useStore();
  const [step, setStep] = useState<'upload' | 'processing' | 'done'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ created: 0, skipped: 0, unresolved: 0 });
  const [unresolvedList, setUnresolvedList] = useState<string[]>([]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setStep('processing');

    try {
      let csvText = '';

      if (file.name.toLowerCase().endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        const csvEntry = Object.keys(zip.files).find(
          (name) => name.toLowerCase().endsWith('.csv') && !name.startsWith('__MACOSX')
        );
        if (!csvEntry) throw new Error('No CSV file found in ZIP');
        const csvBytes = await zip.files[csvEntry].async('uint8array');
        const decoder = new TextDecoder('utf-8', { ignoreBOM: false });
        csvText = decoder.decode(csvBytes);
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        csvText = await file.text();
      } else {
        throw new Error('Please select a .zip or .csv file');
      }

      // Normalize encoding
      if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.slice(1);
      csvText = csvText
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

      const rows = parseCSV(csvText);
      if (rows.length === 0) throw new Error('CSV is empty');

      // Build title → store song ID map from existing songs
      const titleToId = new Map<string, string>();
      for (const song of songs) {
        titleToId.set(song.title, song.id);
      }

      // Build set of existing connections for dedup
      const existingConns = new Set(
        connections.map((c) => `${c.fromSongId}:${c.toSongId}`)
      );

      let created = 0;
      let skipped = 0;
      const unresolved: string[] = [];

      for (const row of rows) {
        const fromId = titleToId.get(row.title);
        if (!fromId) continue;

        // Mix Out: this song → target
        for (const targetTitle of row.mixOutSongs) {
          const targetId = titleToId.get(targetTitle);
          if (!targetId) {
            unresolved.push(`"${row.title}" → "${targetTitle}"`);
            continue;
          }
          const key = `${fromId}:${targetId}`;
          if (existingConns.has(key)) {
            skipped++;
            continue;
          }
          existingConns.add(key);
          addConnection({
            id: crypto.randomUUID(),
            fromSongId: fromId,
            toSongId: targetId,
            notes: '',
            createdAt: new Date().toISOString(),
          });
          created++;
        }

        // Mix In: source → this song
        for (const sourceTitle of row.mixInSongs) {
          const sourceId = titleToId.get(sourceTitle);
          if (!sourceId) {
            unresolved.push(`"${sourceTitle}" → "${row.title}"`);
            continue;
          }
          const key = `${sourceId}:${fromId}`;
          if (existingConns.has(key)) {
            skipped++;
            continue;
          }
          existingConns.add(key);
          addConnection({
            id: crypto.randomUUID(),
            fromSongId: sourceId,
            toSongId: fromId,
            notes: '',
            createdAt: new Date().toISOString(),
          });
          created++;
        }
      }

      // Deduplicate unresolved list
      const uniqueUnresolved = [...new Set(unresolved)];
      setStats({ created, skipped, unresolved: uniqueUnresolved.length });
      setUnresolvedList(uniqueUnresolved);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setStep('upload');
    }
  }, [songs, connections, addConnection]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-bg-card border border-border rounded-xl w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Link size={14} className="text-accent-purple" />
            {step === 'upload' && 'Re-import Connections'}
            {step === 'processing' && 'Processing...'}
            {step === 'done' && 'Connections Imported'}
          </h3>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary rounded transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          {step === 'upload' && (
            <>
              <p className="text-xs text-text-secondary mb-4">
                Upload your ZIP or CSV file to re-import connections for existing songs. Songs won't be modified — only connections will be added.
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragOver ? 'border-accent bg-accent/5' : 'border-border'
                }`}
              >
                <Upload size={28} className="mx-auto mb-3 text-text-muted" />
                <p className="text-xs text-text-muted mb-3">Drop ZIP or CSV here</p>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-accent to-accent-purple text-bg-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
                  <Upload size={12} /> Browse
                  <input
                    type="file"
                    accept=".zip,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </label>
              </div>
              {error && (
                <p className="mt-3 text-xs text-energy-high flex items-center gap-1">
                  <AlertTriangle size={12} /> {error}
                </p>
              )}
            </>
          )}

          {step === 'processing' && (
            <div className="flex items-center justify-center py-8">
              <Loader size={20} className="animate-spin text-accent mr-3" />
              <span className="text-sm text-text-secondary">Resolving connections...</span>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle size={32} className="mx-auto mb-3 text-energy-low" />
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold text-energy-low">{stats.created}</span> connections created</p>
                  {stats.skipped > 0 && (
                    <p className="text-text-secondary text-xs">{stats.skipped} already existed (skipped)</p>
                  )}
                  {stats.unresolved > 0 && (
                    <p className="text-energy-mid text-xs">{stats.unresolved} could not be resolved</p>
                  )}
                </div>
              </div>

              {unresolvedList.length > 0 && (
                <div className="bg-energy-mid/10 border border-energy-mid/30 rounded-lg p-3">
                  <p className="text-xs font-medium text-energy-mid mb-1.5">Unresolved:</p>
                  <div className="max-h-32 overflow-y-auto space-y-0.5">
                    {unresolvedList.map((u, i) => (
                      <p key={i} className="text-[11px] text-text-secondary font-mono">{u}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-accent to-accent-purple text-bg-primary rounded-lg hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
