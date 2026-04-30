import express from 'express';
import songsRouter from './routes/songs.js';
import setlistsRouter from './routes/setlists.js';
import connectionsRouter from './routes/connections.js';
import metadataRouter from './routes/metadata.js';

const app = express();
app.use(express.json({ limit: '200mb' }));

app.use('/api/songs', songsRouter);
app.use('/api/setlists', setlistsRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/metadata', metadataRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = 3030;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
