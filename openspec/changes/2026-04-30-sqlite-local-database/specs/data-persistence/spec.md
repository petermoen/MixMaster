## ADDED Requirements

### Requirement: Lokale SQLite-database als waarheid
De applicatie SHALL alle persistente data (songs, setlists, setlist-songs, connections) opslaan in een lokaal SQLite-bestand op het filesystem (`data/mixmaster.db`), beheerd door een Node-backend met `better-sqlite3`. Browser-storage (IndexedDB, localStorage) SHALL NOT gebruikt worden voor persistente domeindata.

#### Scenario: Eerste start
- **WHEN** de gebruiker `npm run dev` voor de eerste keer draait
- **THEN** de backend maakt `data/mixmaster.db` aan
- **AND** de schema-migratie wordt uitgevoerd
- **AND** alle tabellen bestaan met de juiste foreign keys

#### Scenario: Herstart van computer
- **WHEN** de gebruiker de computer herstart
- **AND** vervolgens `npm run dev` opnieuw draait
- **THEN** alle eerder opgeslagen songs, setlists en connections zijn beschikbaar
- **AND** geen browser-cache wipe of restart kan deze data wissen

#### Scenario: Backup van data
- **WHEN** de gebruiker `data/mixmaster.db` kopieert naar een andere locatie
- **THEN** dat kopie-bestand bevat een volledige backup
- **AND** terugzetten gebeurt door het bestand terug te kopiëren met de backend gestopt

### Requirement: Schema met cascadende verwijderingen
De SQLite-schema SHALL `PRAGMA foreign_keys = ON` afdwingen en `ON DELETE CASCADE` gebruiken op koppeltabellen, zodat het verwijderen van een song automatisch alle bijbehorende `setlist_songs`-rijen en `connections`-rijen opruimt. Dit replicate't het bestaande gedrag van de Zustand-store, zonder dat applicatiecode dit handmatig hoeft te doen.

#### Scenario: Song verwijderen
- **WHEN** een song verwijderd wordt via `DELETE /api/songs/:id`
- **THEN** alle `setlist_songs`-rijen met die `song_id` zijn weg
- **AND** alle `connections`-rijen met `from_song_id` of `to_song_id` gelijk aan die song zijn weg
- **AND** de overige songs en setlists zijn ongewijzigd

#### Scenario: Setlist verwijderen
- **WHEN** een setlist verwijderd wordt
- **THEN** alle bijbehorende `setlist_songs`-rijen zijn weg
- **AND** de songs zelf zijn ongewijzigd

### Requirement: REST API
De backend SHALL een REST API aanbieden onder `/api`, gemount op `localhost:3030`, met endpoints die 1-op-1 corresponderen met de bestaande store-actions. Vite SHALL `/api`-requests proxien naar `localhost:3030` zodat de frontend dezelfde origin kan blijven gebruiken.

#### Scenario: Songs CRUD
- **WHEN** de frontend `GET /api/songs` aanroept
- **THEN** de respons is een JSON-array van alle songs met camelCase-velden die matchen met de `Song`-interface
- **AND** `POST /api/songs` maakt een nieuwe song aan en retourneert het opgeslagen object
- **AND** `PATCH /api/songs/:id` werkt deelvelden bij en retourneert de bijgewerkte song
- **AND** `DELETE /api/songs/:id` verwijdert de song en retourneert `204 No Content`

#### Scenario: Setlist met geneste songs
- **WHEN** de frontend `GET /api/setlists` aanroept
- **THEN** elke setlist bevat een `songs`-array met `songId`, `position`, `cueIn`, `cueOut`, `notes`, gesorteerd op `position` oplopend
- **AND** `POST /api/setlists/:id/songs` voegt een song toe op positie `length`
- **AND** `PUT /api/setlists/:id/songs` vervangt de hele songs-volgorde (gebruikt voor drag-and-drop reorder)
- **AND** `PATCH /api/setlists/:id/songs/:songId` werkt cue-points en notes bij

#### Scenario: Batch-import voor grote ZIP/CSV
- **WHEN** de frontend `POST /api/songs/batch` aanroept met een array van songs
- **THEN** alle songs worden binnen één SQLite-transactie ingevoegd
- **AND** bij een fout in één rij wordt de hele batch teruggedraaid

### Requirement: Frontend zonder browser-persistentie
De Zustand-store SHALL geen `persist`-middleware, `idb-keyval` of vergelijkbare browser-storage meer gebruiken. De store SHALL een dunne in-memory cache zijn die bij app-start via `loadAll()` wordt gevuld vanuit de API en bij elke mutatie de API-respons gebruikt om state bij te werken.

#### Scenario: App-start
- **WHEN** de applicatie laadt
- **THEN** `App.tsx` roept `loadAll()` aan in een `useEffect`
- **AND** terwijl `loaded === false` toont de UI een "Loading..."-state
- **AND** zodra alle drie de resources binnen zijn wordt `loaded` op `true` gezet en rendert de hoofd-UI

#### Scenario: Backend niet bereikbaar
- **WHEN** `loadAll()` faalt omdat de backend niet draait
- **THEN** de UI toont een leesbare foutmelding ("Kan geen verbinding maken met de lokale server. Draait `npm run dev`?")
- **AND** geen oneindige loader

#### Scenario: Mutatie van data
- **WHEN** een component een store-actie aanroept (bv. `addSong`)
- **THEN** de actie roept de overeenkomstige API aan
- **AND** state wordt pas geüpdatet als de API succesvol responseert
- **AND** bij API-fout blijft state ongewijzigd (de fout mag bubble'n naar de caller)

### Requirement: Eén dev-command, twee processen
Het commando `npm run dev` SHALL zowel de Node-backend als de Vite-frontend starten via `concurrently`, met duidelijke prefixen zodat output uit elk proces herkenbaar is. De Vite dev-server SHALL op vaste poort 5173 draaien met `strictPort: true`.

#### Scenario: Normale start
- **WHEN** `npm run dev` wordt uitgevoerd
- **THEN** de backend start op `localhost:3030` en logt "ready"
- **AND** Vite start op `localhost:5173` met proxy actief
- **AND** beide procesnamen zijn zichtbaar als prefix in de gecombineerde output

#### Scenario: Backend faalt bij start
- **WHEN** de backend faalt (bv. poort 3030 bezet, DB-corruptie)
- **THEN** de fout is duidelijk gelabeld met `[server]`-prefix
- **AND** Vite blijft draaien zodat de frontend de "Kan geen verbinding"-fout kan tonen

#### Scenario: Vite-poort bezet
- **WHEN** poort 5173 bezet is bij `npm run dev`
- **THEN** Vite faalt expliciet (`strictPort`)
- **AND** wijkt NIET stilletjes uit naar een andere poort
