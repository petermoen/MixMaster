## 1. Backend scraper

- [x] 1.1 `server/scrapers/youtube.ts` — export: `searchVideos(query: string): Promise<YoutubeVideo[]>`. URL: `https://www.youtube.com/results?search_query=<encoded>&sp=EgIQAQ%3D%3D` (videos-only filter). Realistic User-Agent + `Accept-Language: en-US,en;q=0.9`
- [x] 1.2 Parser: extract `var ytInitialData = (\{[\s\S]*?\});<\/script>` met regex, `JSON.parse`. Failures → `YoutubeParseError`
- [x] 1.3 Navigeer naar `data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[].itemSectionRenderer.contents[].videoRenderer`. Filter alleen items met `videoRenderer` (skip ads, shelves, channelRenderer)
- [x] 1.4 Mapping per video: `{ videoId, title: title.runs[0].text, channel: ownerText.runs[0].text, durationSeconds: parse "m:ss" of "h:mm:ss" uit lengthText.simpleText (null als live), thumbnailUrl: thumbnail.thumbnails[0].url, url: 'https://www.youtube.com/watch?v=' + videoId }`. Max 5 resultaten retourneren
- [x] 1.5 LRU cache: hergebruik patroon van `beatport.ts`, key = `youtube:${query.toLowerCase().trim()}`, max 200, TTL 1 uur

## 2. REST endpoint

- [x] 2.1 In `server/routes/metadata.ts`: `GET /youtube` handler erbij, ≥2 chars query, anders 400 `query_too_short`. Parse-fout → 502 `youtube_parse_failed`. Andere fouten → 502 `youtube_unavailable`

## 3. Frontend API-client

- [x] 3.1 `src/api/client.ts` — voeg `YoutubeVideo`-interface toe (zelfde velden als backend) en `metadataApi.youtube(q)`-functie

## 4. YoutubeSearch component

- [x] 4.1 `src/components/YoutubeSearch.tsx` — props: `{ artist: string; title: string; value: string; onChange: (url: string) => void }`. Interne state: `loading`, `results`, `selectedVideo` (YoutubeVideo | null), `pickerOpen`, `error`
- [x] 4.2 Knop "Zoek op YouTube" naast/boven het URL-veld. Disabled wanneer `artist.trim() === '' || title.trim() === ''` met tooltip "Vul eerst artist en title in"
- [x] 4.3 Bij klik: query = `${artist} ${title}`, fetch top 5. Eerste hit → `onChange(firstHit.url)` + zet `selectedVideo` = firstHit
- [x] 4.4 Bij gevulde `value` die overeenkomt met een hit (videoId match), tonen we de preview-strip onder de input: 60×34 thumbnail, title (truncate), channel, duration. Plus een kleine "Andere kiezen"-link
- [x] 4.5 "Andere kiezen" toont een dropdown met de 5 results. Klik op een ander item → `onChange(item.url)` + update `selectedVideo`. Esc / click-outside sluit dropdown
- [x] 4.6 Error handling: 502/network fout → toon "YouTube niet bereikbaar" naast knop, geen blocker; gebruiker kan zelf URL plakken
- [x] 4.7 Wanneer gebruiker `value` handmatig wijzigt zonder te zoeken, `selectedVideo` resetten zodat preview-strip verdwijnt

## 5. Integratie in SongFormDialog

- [x] 5.1 In `src/components/SongFormDialog.tsx` boven (of naast) het bestaande YouTube URL-veld de `<YoutubeSearch>` plaatsen met `artist`, `title`, `value={youtubeUrl}`, `onChange={setYoutubeUrl}`
- [x] 5.2 Werkt zowel bij Add (na Beatport-prefill) als bij Edit (gebruiker kan ook later YouTube-link aanvullen)
- [x] 5.3 Geen layoutrommel: knop en preview moeten netjes in het bestaande grid passen; eventueel het YouTube URL-veld een eigen sectie geven

## 6. Verificatie

- [x] 6.1 `npm run dev` → `curl "http://localhost:3030/api/metadata/youtube?q=adam+beyer+restless+drumcode"` retourneert ≥1 hit met `videoId` 11 chars en geldige `url`
- [x] 6.2 In UI: open Add Song, vul artist+title (of laat Beatport prefillen), klik "Zoek op YouTube" → URL-veld bevat `https://www.youtube.com/watch?v=<id>` en preview-strip verschijnt onder het veld
- [x] 6.3 Klik "Andere kiezen" → top 5 dropdown, kies de tweede → URL-veld update, preview-strip update
- [x] 6.4 Sla song op → open detail-paneel → klik YouTube → iframe speelt video correct af (huidige extractor herkent het URL-formaat)
- [x] 6.5 Knop disabled wanneer artist of title leeg is, met passende tooltip
- [x] 6.6 Onzin-query (alleen mogelijk via handmatige API-call) levert lege array; UI valt terug op "Geen resultaten gevonden"
- [x] 6.7 Tweede zoekopdracht binnen 1 uur is meetbaar sneller (cache-hit)
