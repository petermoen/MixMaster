## ADDED Requirements

### Requirement: YouTube zoek-endpoint
De backend SHALL een `GET /api/metadata/youtube?q=<query>`-endpoint aanbieden dat de openbare YouTube-zoekresultaten ophaalt en als JSON-array retourneert. Resultaten SHALL een genormaliseerde shape hebben en SHALL filteren op videos (geen mixes, kanalen of playlists). Maximaal 5 resultaten per request.

#### Scenario: Geldige zoekopdracht
- **WHEN** de frontend `GET /api/metadata/youtube?q=adam+beyer+restless` aanroept
- **THEN** is de respons een JSON-array van max 5 objecten met velden `{ videoId, title, channel, durationSeconds, thumbnailUrl, url }`
- **AND** elk `videoId` is exact 11 tekens
- **AND** elke `url` heeft het formaat `https://www.youtube.com/watch?v=<videoId>`

#### Scenario: Te korte query
- **WHEN** `q` ontbreekt of korter is dan 2 tekens
- **THEN** retourneert het endpoint `400 Bad Request` met `{ error: 'query_too_short' }`
- **AND** er wordt geen request naar YouTube gedaan

#### Scenario: Cache-hit
- **WHEN** dezelfde query binnen 1 uur opnieuw wordt aangevraagd
- **THEN** retourneert het endpoint hetzelfde resultaat zonder YouTube opnieuw te raadplegen

#### Scenario: YouTube HTML-structuur veranderd
- **WHEN** de scraper het `ytInitialData`-blob niet kan extraheren of de gevraagde JSON-paden niet kan navigeren
- **THEN** retourneert het endpoint `502 Bad Gateway` met `{ error: 'youtube_parse_failed', message: <details> }`
- **AND** de fout wordt gestructureerd gelogd op de backend met `[scraper:youtube]`-prefix

#### Scenario: Geen resultaten
- **WHEN** YouTube een lege resultaatlijst retourneert (geen `videoRenderer`-items)
- **THEN** retourneert het endpoint `200 OK` met een lege array `[]`
- **AND** de UI behandelt dit als "geen resultaten gevonden", niet als fout

### Requirement: Eén-klik YouTube prefill in song-formulier
De UI SHALL in het Add/Edit Song-formulier een knop "Zoek op YouTube" tonen die op basis van de huidige `artist` en `title` automatisch het YouTube-URL-veld vult met de eerste hit. De knop SHALL beschikbaar zijn ongeacht of de gebruiker via Beatport-prefill of handmatig is begonnen, en SHALL disabled zijn zolang `artist` of `title` leeg is.

#### Scenario: Knop disabled zonder artist of title
- **WHEN** `artist` of `title` leeg is (na trim)
- **THEN** is de knop "Zoek op YouTube" visueel disabled en niet klikbaar
- **AND** een tooltip vertelt "Vul eerst artist en title in"

#### Scenario: Eerste-hit pre-fill
- **WHEN** de gebruiker op "Zoek op YouTube" klikt met geldige `artist` + `title`
- **THEN** wordt query `${artist} ${title}` naar het backend-endpoint gestuurd
- **AND** het YouTube-URL-veld wordt gevuld met de URL van de eerste hit
- **AND** onder het veld verschijnt een preview-strip met thumbnail (60×34), titel, kanaal en duur

#### Scenario: Andere video kiezen
- **WHEN** de gebruiker op "Andere kiezen" klikt onder de preview-strip
- **THEN** verschijnt een dropdown met de top 5 resultaten (thumbnail, titel, kanaal, duur)
- **AND** klik op een ander resultaat vervangt het URL-veld en de preview-strip
- **AND** Esc of click-outside sluit de dropdown

#### Scenario: Handmatige URL-wijziging na zoek
- **WHEN** de gebruiker na een zoekopdracht het URL-veld zelf bewerkt
- **THEN** verdwijnt de preview-strip
- **AND** de handmatige waarde blijft staan en wordt bij opslag gebruikt

#### Scenario: YouTube niet bereikbaar
- **WHEN** het zoek-endpoint faalt (502, netwerkfout, timeout)
- **THEN** toont de UI "YouTube niet bereikbaar" naast de knop
- **AND** het URL-veld blijft volledig editable voor handmatige invoer
- **AND** opslaan van het formulier werkt onafhankelijk van YouTube-status

### Requirement: Compatibiliteit met bestaande embed-rendering
De ingevulde URL SHALL het standaard `https://www.youtube.com/watch?v=<id>` formaat hebben zodat de bestaande regex in `SongDetailPanel` de `videoId` kan extraheren en de iframe-embed correct kan renderen, zonder code-aanpassing in de detail-view.

#### Scenario: URL via prefill afspelen
- **WHEN** een song wordt opgeslagen met een via "Zoek op YouTube" gevulde URL
- **AND** de gebruiker daarna op de YouTube-knop in `SongDetailPanel` klikt
- **THEN** opent het bestaande `YoutubePlayerDialog` en speelt de video af in een iframe
- **AND** geen wijziging aan `SongDetailPanel` of de embed-regex is nodig
