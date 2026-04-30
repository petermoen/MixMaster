## Why

Het YouTube-URL-veld in het song-formulier is nu volledig handmatig: gebruiker moet YouTube openen, zoeken op artist+title, eerste hit kopiëren, terugplakken. In ~99% van de gevallen is die eerste hit correct, dus dat is repetitief werk dat we kunnen automatiseren. Met de Beatport-koppeling al op zijn plek zijn artist en title bovendien meestal al ingevuld op het moment dat de gebruiker bij dit veld komt — een knop "Zoek op YouTube" kan dat in één klik afhandelen.

Architectuur en techniek liggen er al: dezelfde Node-backend, dezelfde `__INITIAL_DATA__`-stijl scrape (YouTube heeft `var ytInitialData = {...};` in de HTML), dezelfde patroon-isolatie in `server/scrapers/`. Geen API-key nodig.

## What Changes

- **Backend scraper** `server/scrapers/youtube.ts` met één export: `searchVideos(query: string): Promise<YoutubeVideo[]>`. Fetcht `https://www.youtube.com/results?search_query=<q>&sp=EgIQAQ%3D%3D` (de `sp`-parameter filtert alleen op videos, geen mixes/playlists) en extraheert `ytInitialData` uit de HTML.
- **REST endpoint** `GET /api/metadata/youtube?q=<query>` toegevoegd aan de bestaande `metadata.ts`-router. Retourneert max 5 results met `{ videoId, title, channel, durationSeconds, thumbnailUrl, url }`. Te korte query → 400. Parse-fout → 502. Dezelfde LRU-cache (200 entries, 1u TTL) als Beatport.
- **Frontend API-client** krijgt `metadataApi.youtube(q)` met bijbehorend `YoutubeVideo`-type.
- **Frontend UI in `SongFormDialog`**: naast het URL-input een knop "Zoek op YouTube". Klik:
  1. Bouwt query uit huidige `artist` + `title` (trimmed). Knop is disabled zolang één van beide leeg is.
  2. Roept endpoint aan, vult `youtubeUrl` met **eerste hit** automatisch in.
  3. Toont onder het veld een compacte preview-strip: thumbnail (60×34) + titel + kanaalnaam + duur, plus een "Andere kiezen"-link.
  4. "Andere kiezen" toont een dropdown met top 5; klik op een ander resultaat vervangt URL en preview.
- **Geen wijzigingen aan opslag, schema, embed-rendering**: het ingevulde URL-formaat (`https://www.youtube.com/watch?v=<id>`) wordt al correct geparsed door de bestaande regex in `SongDetailPanel`.

## Capabilities

### New Capabilities

- `youtube-search`: Vanuit het Add/Edit Song-formulier kan de gebruiker met één klik op een knop een YouTube-link automatisch laten invullen op basis van artist+title. Zeldzame mismatches kunnen gecorrigeerd worden via een keuzelijst van top 5.

### Modified Capabilities

_(none — `beatport-metadata` blijft ongewijzigd; YouTube-zoek is additief en gebruikt z'n eigen endpoint)_

## Impact

**Nieuw:**
- `server/scrapers/youtube.ts` — fetch + `ytInitialData`-extractie + mapping naar `YoutubeVideo`-shape
- `src/components/YoutubeSearch.tsx` — knop + preview-strip + dropdown component (gebruikt door `SongFormDialog`)

**Aangepast:**
- `server/routes/metadata.ts` — extra `GET /youtube` handler erbij gemount
- `src/api/client.ts` — `metadataApi.youtube()` + `YoutubeVideo`-type
- `src/components/SongFormDialog.tsx` — `YoutubeSearch` ingebed naast het YouTube-URL-veld; bij selectie wordt `youtubeUrl`-state geüpdatet

**Niet geraakt:**
- `Song`-interface, schema, embed-iframe in `SongDetailPanel`. De URL die we invullen heeft het standaard `watch?v=<id>` formaat dat al door de bestaande extractor wordt herkend.

## Risks

- **YouTube site-redesign:** `ytInitialData`-shape kan veranderen. Mitigatie: scraper isoleren in één bestand; parse-fouten loggen met `[scraper:youtube]`-prefix; UI faalt graceful en blokkeert handmatig invoeren niet (knop disabled met tooltip "YouTube tijdelijk niet bereikbaar").
- **Eerste hit niet altijd correct:** sommige tracks hebben een fan-upload, een live versie of een hardstyle-edit als eerste hit. Mitigatie: de "Andere kiezen"-link toont top 5 zodat de gebruiker altijd binnen het formulier kan corrigeren — geen reden om YouTube apart te openen.
- **Bot-detectie:** YouTube kan requests vanaf één IP blokkeren bij hoge frequentie. Mitigatie: realistische User-Agent, in-memory cache, alleen on-demand op user-actie. Bij blokkade later eventueel cookie-jar of `&pbj=1`-trick. Niet vooraf oplossen — eerst meten.
- **TOS-grijs gebied:** YouTube's TOS staat scrapen niet expliciet toe. Voor persoonlijk lokaal gebruik (één gebruiker, geen herdistributie) is risico klein, maar zelfde caveat als Beatport: niet publiek hosten zonder TOS na te lezen.
