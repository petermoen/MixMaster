## 1. Beatport scraper-onderzoek (eerst, kort)

- [x] 1.1 Manueel `curl https://www.beatport.com/search?q=adam+beyer+restless` uitvoeren met realistische User-Agent. Bevestig dat HTML bruikbare `<script id="__NEXT_DATA__">…</script>` blob bevat met search results
- [x] 1.2 Manueel een track-detail page fetchen (bv. `https://www.beatport.com/track/restless/12345678`). Bevestig dat dezelfde JSON-blob alle velden bevat: bpm, key, genre, label, length_ms, publish_date, image, artists
- [x] 1.3 Documenteer de JSON-paden in `server/scrapers/beatport.ts` als comment, zodat parsing herstellen makkelijk is bij toekomstige shape-shift

## 2. Backend scraper

- [x] 2.1 `lru-cache` toevoegen als dependency
- [x] 2.2 `server/scrapers/beatport.ts` — export: `searchTracks(query: string): Promise<BeatportTrack[]>`. Gebruikt `fetch` met realistic UA + `Accept-Language: en-US,en;q=0.9`
- [x] 2.3 Parser: extract `<script id="__NEXT_DATA__" type="application/json">…</script>` body, `JSON.parse`, navigeer naar `props.pageProps.dehydratedState.queries[0].state.data.tracks.data`. Failures → throw met klare error-class `BeatportParseError`
- [x] 2.4 Mapping per track naar genormaliseerde shape `{ id, title, mixName, artists: string[], bpm, key, genre, label, releaseDate, durationMs, artworkUrl, beatportUrl }`. Alle velden mogen `null` zijn behalve `id`, `title`, `artists`, `beatportUrl`. `artworkUrl` uit `release.release_image_uri`. `releaseDate` als `YYYY-MM-DD` (eerste 10 chars). `beatportUrl` = `https://www.beatport.com/track/-/${id}`
- [x] 2.5 In-memory LRU cache: `max: 200`, `ttl: 1000 * 60 * 60` (1 uur). Cache key = `search:${query.toLowerCase().trim()}`

## 3. REST endpoint

- [x] 3.1 `server/routes/metadata.ts` — `GET /api/metadata/search?q=<query>` (min. 2 chars), retourneert array van max ~15 tracks. Te korte query → 400. Parse-fout → 502 met `{ error: 'beatport_parse_failed', message: ... }`
- [x] 3.2 Mount in `server/index.ts` onder `/api/metadata`

## 4. Frontend API-client

- [x] 4.1 `src/api/client.ts` — voeg `metadataApi.search(q)` toe met TypeScript-type `BeatportTrack` die de genormaliseerde shape spiegelt

## 5. BeatportSearch component

- [x] 5.1 `src/components/BeatportSearch.tsx` — props: `onSelect(track: BeatportTrack)`, `disabled?`. Interne state: query, results, loading, error
- [x] 5.2 Debounce (~400ms) op input-change, alleen zoeken bij ≥2 chars
- [x] 5.3 Dropdown toont per resultaat: artwork-thumb (40x40), artist `(.join(', '))`, titel + mixName, label. Klik = `onSelect(track)` (geen extra fetch nodig — de search-result heeft alle velden)
- [x] 5.4 Lege staat: "Type om Beatport te zoeken". Loading: spinner. Error: "Beatport-zoekopdracht mislukt — vul handmatig in" (geen blocker)
- [x] 5.5 Esc / blur sluit dropdown; selectie sluit dropdown en cleart query

## 6. Integratie in SongFormDialog

- [x] 6.1 In `src/components/SongFormDialog.tsx`: voeg `BeatportSearch` toe bovenaan het formulier, alleen zichtbaar wanneer er nog geen song wordt bewerkt (`!editSong`)
- [x] 6.2 `onSelect`-callback vult form-state: `title` ← `track.title` (eventueel met `(mixName)` suffix als ≠ "Original Mix"), `artist` ← `track.artists.join(', ')`, `bpm`, `key` (formaat-mapping zo nodig), `genre`, `recordLabel` ← `track.label`, `thumbnail` ← `track.artworkUrl`, `releaseDate` ← `track.releaseDate`, `duration` ← convert `durationMs` naar `m:ss`-string
- [x] 6.3 Niet-Beatport velden (`energyLevel`, `notes`, `youtubeUrl`) blijven leeg / op default — gebruiker vult zelf
- [x] 6.4 Velden blijven volledig editable na selectie zodat gebruiker kan corrigeren

## 7. Verificatie

- [x] 7.1 `npm run dev` — frontend en backend starten. `/api/metadata/search?q=adam+beyer` retourneert ≥1 resultaat
- [x] 7.2 In UI: open Add Song dialog, type "adam beyer restless" → resultaten verschijnen → klik → form is gevuld met correcte BPM, key, label, artwork
- [x] 7.3 Sla de song op → controleer dat alle velden incl. `thumbnail`-URL correct in SQLite staan (`sqlite3 data/mixmaster.db "SELECT * FROM songs ORDER BY created_at DESC LIMIT 1"`)
- [x] 7.4 Search met onzin-query → lege state, geen crash
- [x] 7.5 Zet backend offline / sloop scraper-parsing tijdelijk → UI toont fout, formulier blijft bruikbaar voor handmatige invoer
- [x] 7.6 Tweede zoekopdracht met dezelfde query binnen 1 uur → backend logt cache-hit, sneller
