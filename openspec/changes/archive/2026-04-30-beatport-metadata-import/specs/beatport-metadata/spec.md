## ADDED Requirements

### Requirement: Beatport zoek-endpoint
De backend SHALL een `GET /api/metadata/search?q=<query>`-endpoint aanbieden dat de openbare Beatport-zoekresultaten ophaalt en als JSON-array retourneert. Resultaten SHALL een genormaliseerde shape hebben die los staat van Beatport's interne structuur. De zoekrespons SHALL alle velden bevatten die nodig zijn voor pre-fill (BPM, key, genre, label, release date, duration, artwork) — er is geen aparte detail-fetch.

#### Scenario: Geldige zoekopdracht
- **WHEN** de frontend `GET /api/metadata/search?q=adam+beyer+restless` aanroept
- **THEN** de respons is een JSON-array van max ~15 objecten met velden `{ id, title, mixName, artists, bpm, key, genre, label, releaseDate, durationMs, artworkUrl, beatportUrl }`
- **AND** elk resultaat heeft minimaal `id`, `title`, `artists` en `beatportUrl`
- **AND** ontbrekende velden zijn `null` (niet weggelaten)

#### Scenario: Te korte query
- **WHEN** `q` ontbreekt of korter is dan 2 tekens
- **THEN** retourneert het endpoint `400 Bad Request` met `{ error: 'query_too_short' }`
- **AND** er wordt geen request naar Beatport gedaan

#### Scenario: Cache-hit
- **WHEN** dezelfde query binnen 1 uur opnieuw wordt aangevraagd
- **THEN** retourneert het endpoint hetzelfde resultaat zonder Beatport opnieuw te raadplegen
- **AND** de respons is meetbaar sneller dan de eerste call

#### Scenario: Beatport HTML-structuur veranderd
- **WHEN** de scraper het `__NEXT_DATA__`-blob niet kan parsen
- **THEN** retourneert het endpoint `502 Bad Gateway` met `{ error: 'beatport_parse_failed', message: <details> }`
- **AND** de fout wordt gestructureerd gelogd op de backend

### Requirement: Pre-fill van het song-formulier
De UI SHALL bovenaan het Add-Song-formulier een Beatport-zoekveld tonen waarin de gebruiker een query kan typen, een resultaat kan kiezen en daarmee de form-velden in één keer kan vullen. Velden SHALL na pre-fill volledig editable blijven zodat de gebruiker correcties kan maken vóór opslaan.

#### Scenario: Gebruiker zoekt en selecteert
- **WHEN** de gebruiker minstens 2 tekens typt in het Beatport-zoekveld
- **THEN** verschijnt na ~400ms debounce een dropdown met resultaten (artwork, artist, title, label)
- **AND** klik op een resultaat haalt detail op en vult: `title`, `artist` (artists samengevoegd met komma), `bpm`, `key`, `genre`, `recordLabel`, `releaseDate`, `duration` (formaat `m:ss`), `thumbnail`
- **AND** de niet-Beatport-velden (`energyLevel`, `notes`, `youtubeUrl`) blijven onaangeroerd

#### Scenario: Selectie ongedaan maken
- **WHEN** de gebruiker na een selectie een veld handmatig wijzigt
- **THEN** zijn wijzigingen blijven staan en worden bij opslag gebruikt
- **AND** er is geen "lock" of overlay vanwege Beatport-herkomst

#### Scenario: Beatport tijdelijk niet bereikbaar
- **WHEN** het zoek-endpoint faalt (502, netwerkfout, timeout)
- **THEN** de UI toont "Beatport-zoekopdracht mislukt — vul handmatig in" naast het zoekveld
- **AND** het formulier blijft volledig bruikbaar voor handmatige invoer
- **AND** opslaan werkt onafhankelijk van Beatport-status

#### Scenario: Pre-fill bij bestaande song
- **WHEN** het formulier wordt geopend om een bestaande song te bewerken
- **THEN** de Beatport-zoekbalk is verborgen
- **AND** alleen de bestaande veldwaarden zijn zichtbaar en editable

### Requirement: Robuustheid van scraping
De scraper SHALL `__NEXT_DATA__`-extractie isoleren in één bestand zodat herstel bij Beatport-changes lokaal kan. Parse-fouten SHALL gestructureerd gelogd worden met de query/id en de aard van de fout, zonder de gehele backend te laten crashen. Requests SHALL een realistische User-Agent-header sturen om triviale bot-blokkades te vermijden.

#### Scenario: Selector/JSON-pad niet meer geldig
- **WHEN** Beatport hun front-end aanpast en het verwachte JSON-pad bestaat niet meer
- **THEN** gooit de scraper een `BeatportParseError` met de query/id in het bericht
- **AND** de fout wordt gelogd met `[scraper:beatport]`-prefix
- **AND** het endpoint vertaalt dit naar `502` zonder de Express-process te killen

#### Scenario: Realistische User-Agent
- **WHEN** de scraper een Beatport-pagina fetcht
- **THEN** stuurt het een `User-Agent`-header die overeenkomt met een actuele desktop-browser
- **AND** een `Accept-Language: en-US,en;q=0.9`-header
