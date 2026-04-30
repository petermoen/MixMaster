import { LRUCache } from 'lru-cache';

export interface BeatportTrack {
  id: number;
  title: string;
  mixName: string | null;
  artists: string[];
  bpm: number | null;
  key: string | null;
  genre: string | null;
  label: string | null;
  releaseDate: string | null;
  durationMs: number | null;
  artworkUrl: string | null;
  beatportUrl: string;
}

export class BeatportParseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'BeatportParseError';
  }
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// JSON path within the Next.js __NEXT_DATA__ blob:
//   props.pageProps.dehydratedState.queries[0].state.data.tracks.data
// Each track item has: track_id, track_name, mix_name, artists[].artist_name,
// bpm, key_name, label.label_name, genre[0].genre_name, publish_date (ISO),
// length (ms), release.release_image_uri.
const NEXT_DATA_RE =
  /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/;

const cache = new LRUCache<string, BeatportTrack[]>({
  max: 200,
  ttl: 1000 * 60 * 60, // 1 hour
});

interface RawArtist {
  artist_name?: string;
}

interface RawTrack {
  track_id?: number;
  track_name?: string;
  mix_name?: string;
  artists?: RawArtist[];
  bpm?: number | null;
  key_name?: string | null;
  label?: { label_name?: string } | null;
  genre?: Array<{ genre_name?: string }> | null;
  publish_date?: string | null;
  release_date?: string | null;
  length?: number | null;
  release?: { release_image_uri?: string | null } | null;
}

function mapTrack(raw: RawTrack): BeatportTrack | null {
  const id = raw.track_id;
  const title = raw.track_name;
  const artists = (raw.artists ?? [])
    .map((a) => a.artist_name)
    .filter((n): n is string => typeof n === 'string' && n.length > 0);

  if (typeof id !== 'number' || !title || artists.length === 0) return null;

  const releaseDateRaw = raw.publish_date ?? raw.release_date ?? null;
  const releaseDate =
    typeof releaseDateRaw === 'string' && releaseDateRaw.length >= 10
      ? releaseDateRaw.slice(0, 10)
      : null;

  return {
    id,
    title,
    mixName: raw.mix_name ?? null,
    artists,
    bpm: typeof raw.bpm === 'number' ? raw.bpm : null,
    key: raw.key_name ?? null,
    genre: raw.genre?.[0]?.genre_name ?? null,
    label: raw.label?.label_name ?? null,
    releaseDate,
    durationMs: typeof raw.length === 'number' ? raw.length : null,
    artworkUrl: raw.release?.release_image_uri ?? null,
    beatportUrl: `https://www.beatport.com/track/-/${id}`,
  };
}

export async function searchTracks(query: string): Promise<BeatportTrack[]> {
  const key = `search:${query.toLowerCase().trim()}`;
  const cached = cache.get(key);
  if (cached) {
    console.log(`[scraper:beatport] cache hit for "${query}"`);
    return cached;
  }

  const url = `https://www.beatport.com/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  });

  if (!res.ok) {
    throw new BeatportParseError(
      `beatport returned ${res.status} for query "${query}"`
    );
  }

  const html = await res.text();
  const match = html.match(NEXT_DATA_RE);
  if (!match) {
    throw new BeatportParseError('__NEXT_DATA__ script tag not found');
  }

  let data: unknown;
  try {
    data = JSON.parse(match[1]);
  } catch (err) {
    throw new BeatportParseError('failed to parse __NEXT_DATA__ JSON', err);
  }

  const tracks = extractTracks(data);
  const mapped = tracks
    .map(mapTrack)
    .filter((t): t is BeatportTrack => t !== null)
    .slice(0, 15);

  cache.set(key, mapped);
  return mapped;
}

function extractTracks(data: unknown): RawTrack[] {
  try {
    const queries = (
      data as {
        props?: {
          pageProps?: {
            dehydratedState?: {
              queries?: Array<{ state?: { data?: { tracks?: { data?: RawTrack[] } } } }>;
            };
          };
        };
      }
    ).props?.pageProps?.dehydratedState?.queries;

    if (!Array.isArray(queries)) {
      throw new BeatportParseError('dehydratedState.queries not an array');
    }

    for (const q of queries) {
      const tracks = q.state?.data?.tracks?.data;
      if (Array.isArray(tracks)) return tracks;
    }
    throw new BeatportParseError('no query in dehydratedState contained tracks.data');
  } catch (err) {
    if (err instanceof BeatportParseError) throw err;
    throw new BeatportParseError('unexpected shape navigating __NEXT_DATA__', err);
  }
}
