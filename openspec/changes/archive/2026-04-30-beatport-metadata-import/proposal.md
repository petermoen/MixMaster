## Why

Het toevoegen van een song is nu volledig handwerk: titel, artist, BPM, key, label, artwork, release date en duration moeten allemaal handmatig worden ingevuld. Voor de meeste tracks staat deze metadata al netjes op Beatport. Een zoek-en-prefill koppeling met Beatport bespaart per song minuten typewerk en voorkomt typefouten in BPM/key (die later nodig zijn voor cue-keuzes).

Geen officiële API beschikbaar zonder partner-credentials. Daarom: scrape de openbare Beatport-website server-side via onze Node-backend (dezelfde die nu SQLite serveert). Dat is praktisch (geen CORS, geen client-keys) en past binnen de bestaande architectuur.

## What Changes

- **Backend scraper** `server/scrapers/beatport.ts` die Beatport's zoekpagina fetcht en de Next.js `__NEXT_DATA__` JSON uit de HTML extraheert. De search-response blijkt al alle velden te bevatten (bpm, key, genre, label, release date, length, artwork) — een aparte track-detail-fetch is niet nodig.
- **REST endpoint** `GET /api/metadata/search?q=...` onder een nieuwe `metadata.ts` route. Resultaten worden in een eenvoudige in-memory LRU cache (~1 uur TTL) gehouden om herhaal-requests en rate-limiting te beperken.
- **Genormaliseerde response shape** die 1-op-1 mapt naar onze `Song`-interface waar mogelijk: `id`, `title`, `mixName`, `artists[]`, `bpm`, `key`, `genre`, `label`, `releaseDate`, `durationMs`, `artworkUrl`, `beatportUrl`. Alle velden behalve `id`, `title`, `artists` en `beatportUrl` mogen `null` zijn.
- **Frontend zoek-component** in `SongFormDialog`: bovenaan een zoekveld "Zoek op Beatport". Debounced (~400ms), dropdown met thumbnails + artist + title + label. Klik op resultaat → form-velden worden gevuld uit de search-result data; gebruiker kan ze daarna nog vrij wijzigen voor opslaan.
- **Mapping in de UI**: artist-veld krijgt `artists.join(', ')`, title krijgt `title` (mixName wordt apart aangevuld als suffix " (Mix Name)" als die afwijkt van "Original Mix" — beslissing bij implementatie).
- **Robuustheid**: scraper logt selector/parse-fouten gestructureerd zodat we snel zien wanneer Beatport iets verandert. Bij parse-fout faalt het endpoint met 502 + leesbare melding; de UI toont "Beatport-zoekopdracht mislukt — vul handmatig in" en blokkeert het formulier niet.

## Capabilities

### New Capabilities

- `beatport-metadata`: De applicatie kan via een zoekopdracht op Beatport metadata ophalen voor een track (artist, title, BPM, key, genre, label, artwork, release date, duration) en die als pre-fill gebruiken in het song-formulier.

### Modified Capabilities

_(none — bestaande song-CRUD blijft ongewijzigd; Beatport-import is puur additief)_

## Impact

**Nieuw:**
- `server/scrapers/beatport.ts` — fetch + Next.js JSON-extractie + mapping naar genormaliseerde shape
- `server/routes/metadata.ts` — twee endpoints met in-memory LRU caching
- `src/api/client.ts` — nieuwe `metadataApi.search()` en `metadataApi.getTrack()` wrappers
- `src/components/BeatportSearch.tsx` — debounced zoekveld + dropdown component, herbruikbaar binnen `SongFormDialog`

**Aangepast:**
- `src/components/SongFormDialog.tsx` — `BeatportSearch` ingebed bovenaan; bij selectie wordt form-state gevuld via een `onSelectMetadata`-callback
- `package.json` — afhankelijkheid `lru-cache` toegevoegd; geen verdere browser-dependencies (cheerio of jsdom is niet nodig voor `__NEXT_DATA__`-extractie, regex/parse voldoet)

**Niet geraakt:**
- `Song`-interface, schema, store, API-routes voor songs/setlists/connections — geen wijzigingen nodig. De Beatport-data wordt vóór opslag in de bestaande velden gepropt; opslag is gewoon `addSong`.

## Risks

- **Beatport site-redesign:** scrapen breekt zodra hun front-end of `__NEXT_DATA__`-shape verandert. Mitigatie: scraper isoleren in één bestand, parse-fouten loggen, UI faalt graceful en blokkeert handmatig invoeren niet.
- **Rate limiting / bot-detectie:** Beatport kan onze requests blokkeren bij te hoge frequentie. Mitigatie: realistische User-Agent + Accept-Language headers, in-memory cache, geen prefetch, alleen on-demand op user-actie. Indien geblokkeerd later: cookie/session-handling toevoegen.
- **TOS-grijs gebied:** Beatport's TOS staat scrapen niet expliciet toe. Voor persoonlijk lokaal gebruik (één gebruiker, geen herdistributie van data) is het risico klein, maar dit is geen tool om publiek te hosten zonder eerst de TOS na te lezen. Documenteren in README.
- **Partial data:** sommige tracks (oudere releases, bootlegs) hebben geen BPM/key in Beatport. Mitigatie: ontbrekende velden blijven leeg in de form; gebruiker vult ze handmatig.
- **Cloudflare / JS-challenge:** als Beatport een bot-challenge serveert, werkt simpele `fetch` niet meer. Eerst proberen met node `fetch`; bij blokkade: optie om over te stappen op `undici` met cookie-jar of (uiterst geval) playwright. Niet meteen oplossen — eerst meten.
