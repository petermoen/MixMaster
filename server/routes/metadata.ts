import { Router } from 'express';
import { searchTracks, BeatportParseError } from '../scrapers/beatport.js';
import { searchVideos, YoutubeParseError } from '../scrapers/youtube.js';

const router = Router();

router.get('/search', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 2) {
    res.status(400).json({ error: 'query_too_short' });
    return;
  }
  try {
    const results = await searchTracks(q);
    res.json(results);
  } catch (err) {
    if (err instanceof BeatportParseError) {
      console.error(`[scraper:beatport] parse failed for "${q}":`, err.message);
      res.status(502).json({
        error: 'beatport_parse_failed',
        message: err.message,
      });
      return;
    }
    console.error(`[scraper:beatport] error for "${q}":`, err);
    res.status(502).json({
      error: 'beatport_unavailable',
      message: err instanceof Error ? err.message : 'unknown error',
    });
  }
});

router.get('/youtube', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 2) {
    res.status(400).json({ error: 'query_too_short' });
    return;
  }
  try {
    const results = await searchVideos(q);
    res.json(results);
  } catch (err) {
    if (err instanceof YoutubeParseError) {
      console.error(`[scraper:youtube] parse failed for "${q}":`, err.message);
      res.status(502).json({
        error: 'youtube_parse_failed',
        message: err.message,
      });
      return;
    }
    console.error(`[scraper:youtube] error for "${q}":`, err);
    res.status(502).json({
      error: 'youtube_unavailable',
      message: err instanceof Error ? err.message : 'unknown error',
    });
  }
});

export default router;
