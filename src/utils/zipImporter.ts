import JSZip from 'jszip';
import { parseCSV, type RawImportRow } from './csvParser';

export interface ImportSongPreview {
  id: string;
  raw: RawImportRow;
  title: string;
  artist: string;
  bpm: number | null;
  key: string;
  genre: string;
  energyLevel: number;
  duration: string;
  releaseDate: string;
  recordLabel: string;
  notes: string;
  thumbnail: string | null;
  imageFound: boolean;
  mixInTitles: string[];
  mixOutTitles: string[];
  selected: boolean;
}

export interface ImportResult {
  songs: ImportSongPreview[];
  warnings: string[];
}

function energyToNumber(energy: string): number {
  switch (energy.toLowerCase()) {
    case 'low': return 3;
    case 'medium': return 5;
    case 'high': return 8;
    default: {
      const n = parseInt(energy, 10);
      return isNaN(n) ? 5 : Math.min(10, Math.max(1, n));
    }
  }
}

function fileToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface ParseProgress {
  phase: 'reading' | 'csv' | 'images' | 'done';
  current: number;
  total: number;
  currentTitle: string;
}

export async function parseZipImport(
  file: File,
  onProgress?: (progress: ParseProgress) => void
): Promise<ImportResult> {
  onProgress?.({ phase: 'reading', current: 0, total: 1, currentTitle: 'Opening ZIP...' });
  const zip = await JSZip.loadAsync(file);
  const warnings: string[] = [];

  // Find CSV file
  onProgress?.({ phase: 'csv', current: 0, total: 1, currentTitle: 'Parsing CSV...' });
  let csvText = '';
  const csvEntry = Object.keys(zip.files).find(
    (name) => name.toLowerCase().endsWith('.csv') && !name.startsWith('__MACOSX')
  );
  if (csvEntry) {
    csvText = await zip.files[csvEntry].async('string');
  } else {
    throw new Error('No CSV file found in ZIP');
  }

  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    throw new Error('CSV is empty or could not be parsed');
  }

  // Build image map (lowercase filename → zip path)
  const imageMap = new Map<string, string>();
  for (const path of Object.keys(zip.files)) {
    if (zip.files[path].dir) continue;
    if (path.startsWith('__MACOSX')) continue;
    const name = path.split('/').pop()?.toLowerCase();
    if (name && /\.(png|jpg|jpeg|webp|gif)$/i.test(name)) {
      imageMap.set(name, path);
    }
  }

  // Process rows with progress
  const songs: ImportSongPreview[] = [];
  const total = rows.length;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    onProgress?.({ phase: 'images', current: i + 1, total, currentTitle: row.title });

    let thumbnail: string | null = null;
    let imageFound = false;

    if (row.imageFilename) {
      const imgPath = imageMap.get(row.imageFilename.toLowerCase());
      if (imgPath) {
        const blob = await zip.files[imgPath].async('blob');
        thumbnail = await fileToBase64(blob);
        imageFound = true;
      } else {
        warnings.push(`Image not found: "${row.imageFilename}" for "${row.title}"`);
      }
    }

    songs.push({
      id: crypto.randomUUID(),
      raw: row,
      title: row.title,
      artist: row.artist,
      bpm: row.bpm ? parseInt(row.bpm, 10) || null : null,
      key: row.key,
      genre: row.genre,
      energyLevel: energyToNumber(row.energy),
      duration: row.duration,
      releaseDate: row.releaseDate,
      recordLabel: row.recordLabel,
      notes: row.notes,
      thumbnail,
      imageFound,
      mixInTitles: row.mixInSongs,
      mixOutTitles: row.mixOutSongs,
      selected: true,
    });
  }

  onProgress?.({ phase: 'done', current: total, total, currentTitle: '' });
  return { songs, warnings };
}

/**
 * Resolve connection titles to song IDs after import.
 * Returns connections and a list of unresolved references.
 */
export function resolveConnections(
  songs: ImportSongPreview[]
): { connections: { fromSongId: string; toSongId: string }[]; unresolved: string[] } {
  const titleToId = new Map<string, string>();
  for (const song of songs) {
    if (song.selected) {
      titleToId.set(song.title, song.id);
    }
  }

  const seen = new Set<string>();
  const connections: { fromSongId: string; toSongId: string }[] = [];
  const unresolved: string[] = [];

  for (const song of songs) {
    if (!song.selected) continue;

    // Mix Out: this song → target
    for (const targetTitle of song.mixOutTitles) {
      const targetId = titleToId.get(targetTitle);
      if (!targetId) {
        unresolved.push(`"${song.title}" → "${targetTitle}"`);
        continue;
      }
      const key = `${song.id}:${targetId}`;
      if (!seen.has(key)) {
        seen.add(key);
        connections.push({ fromSongId: song.id, toSongId: targetId });
      }
    }

    // Mix In: source → this song
    for (const sourceTitle of song.mixInTitles) {
      const sourceId = titleToId.get(sourceTitle);
      if (!sourceId) {
        unresolved.push(`"${sourceTitle}" → "${song.title}"`);
        continue;
      }
      const key = `${sourceId}:${song.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        connections.push({ fromSongId: sourceId, toSongId: song.id });
      }
    }
  }

  return { connections, unresolved };
}
