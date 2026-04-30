import { LRUCache } from 'lru-cache';

export interface YoutubeVideo {
  videoId: string;
  title: string;
  channel: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  url: string;
}

export class YoutubeParseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'YoutubeParseError';
  }
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// JSON path within the youtube.com/results page:
//   data.contents.twoColumnSearchResultsRenderer.primaryContents
//     .sectionListRenderer.contents[].itemSectionRenderer.contents[].videoRenderer
// `sp=EgIQAQ%3D%3D` filters to videos only (no playlists/channels/shelves).
const YT_INITIAL_DATA_RE = /var ytInitialData = (\{[\s\S]*?\});<\/script>/;

const cache = new LRUCache<string, YoutubeVideo[]>({
  max: 200,
  ttl: 1000 * 60 * 60, // 1 hour
});

interface RawVideoRenderer {
  videoId?: string;
  title?: { runs?: Array<{ text?: string }>; simpleText?: string };
  ownerText?: { runs?: Array<{ text?: string }> };
  longBylineText?: { runs?: Array<{ text?: string }> };
  lengthText?: { simpleText?: string };
  thumbnail?: { thumbnails?: Array<{ url?: string; width?: number }> };
}

function parseDuration(text?: string): number | null {
  if (!text) return null;
  const parts = text.split(':').map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function pickThumbnail(thumbs?: Array<{ url?: string; width?: number }>): string | null {
  if (!thumbs || thumbs.length === 0) return null;
  // Prefer the smallest non-tiny thumbnail (usually 120x68 default).
  const sorted = [...thumbs].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return sorted[0].url ?? null;
}

function mapVideo(v: RawVideoRenderer): YoutubeVideo | null {
  const videoId = v.videoId;
  const title = v.title?.runs?.[0]?.text ?? v.title?.simpleText;
  if (!videoId || !title) return null;

  const channel =
    v.ownerText?.runs?.[0]?.text ??
    v.longBylineText?.runs?.[0]?.text ??
    null;

  return {
    videoId,
    title,
    channel,
    durationSeconds: parseDuration(v.lengthText?.simpleText),
    thumbnailUrl: pickThumbnail(v.thumbnail?.thumbnails),
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export async function searchVideos(query: string): Promise<YoutubeVideo[]> {
  const key = `youtube:${query.toLowerCase().trim()}`;
  const cached = cache.get(key);
  if (cached) {
    console.log(`[scraper:youtube] cache hit for "${query}"`);
    return cached;
  }

  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  });

  if (!res.ok) {
    throw new YoutubeParseError(
      `youtube returned ${res.status} for query "${query}"`
    );
  }

  const html = await res.text();
  const match = html.match(YT_INITIAL_DATA_RE);
  if (!match) {
    throw new YoutubeParseError('ytInitialData script var not found');
  }

  let data: unknown;
  try {
    data = JSON.parse(match[1]);
  } catch (err) {
    throw new YoutubeParseError('failed to parse ytInitialData JSON', err);
  }

  const videos = extractVideos(data).map(mapVideo).filter((v): v is YoutubeVideo => v !== null);
  const top = videos.slice(0, 5);
  cache.set(key, top);
  return top;
}

function extractVideos(data: unknown): RawVideoRenderer[] {
  try {
    const sections = (
      data as {
        contents?: {
          twoColumnSearchResultsRenderer?: {
            primaryContents?: {
              sectionListRenderer?: {
                contents?: Array<{
                  itemSectionRenderer?: {
                    contents?: Array<{ videoRenderer?: RawVideoRenderer }>;
                  };
                }>;
              };
            };
          };
        };
      }
    ).contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

    if (!Array.isArray(sections)) {
      throw new YoutubeParseError('sectionListRenderer.contents not an array');
    }

    const videos: RawVideoRenderer[] = [];
    for (const sec of sections) {
      const items = sec.itemSectionRenderer?.contents ?? [];
      for (const it of items) {
        if (it.videoRenderer) videos.push(it.videoRenderer);
      }
    }
    return videos;
  } catch (err) {
    if (err instanceof YoutubeParseError) throw err;
    throw new YoutubeParseError('unexpected shape navigating ytInitialData', err);
  }
}
