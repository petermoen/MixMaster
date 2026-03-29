/**
 * CSV parser that handles quoted fields with commas and semicolons inside.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

export interface RawImportRow {
  title: string;
  artist: string;
  bpm: string;
  key: string;
  genre: string;
  energy: string;
  duration: string;
  releaseDate: string;
  recordLabel: string;
  notes: string;
  mixInSongs: string[];
  mixOutSongs: string[];
  imageFilename: string;
}

function splitConnectionList(value: string): string[] {
  if (!value.trim()) return [];
  return value.split(';').map((s) => s.trim()).filter(Boolean);
}

export function parseCSV(csvText: string): RawImportRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Skip header
  const rows = lines.slice(1);

  return rows.map((line) => {
    const f = parseCSVLine(line);
    return {
      title: f[0] || '',
      artist: f[1] || '',
      bpm: f[2] || '',
      key: f[3] || '',
      genre: f[4] || '',
      energy: f[5] || '',
      duration: f[6] || '',
      releaseDate: f[7] || '',
      recordLabel: f[8] || '',
      notes: f[9] || '',
      mixInSongs: splitConnectionList(f[10] || ''),
      mixOutSongs: splitConnectionList(f[11] || ''),
      imageFilename: f[12] || '',
    };
  }).filter((r) => r.title);
}
