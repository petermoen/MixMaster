## Why

Browser-storage (IndexedDB) is voor deze app onbetrouwbaar gebleken. Op 29 april 2026 is een complete dataset verloren gegaan na een browser-cache wipe — eviction-protectie kun je aanvragen, maar er is geen garantie. Voor een tool waarin uren werk zit (cue points, transitions, setlist-volgorde) is "best-effort" niet goed genoeg.

We verhuizen de dataopslag naar een echte database op het filesystem: **SQLite** via een lichte Node-backend met `better-sqlite3`. Eén `.db`-bestand, te kopiëren, te backuppen, niet onderhevig aan browser eviction of cache-wipes.

## What Changes

- **Node-backend** (`server/`) met Express en `better-sqlite3`. Draait op `localhost:3030`. Eén SQLite-bestand `./data/mixmaster.db` (gitignored).
- **REST API** voor de drie resources: songs, setlists (incl. setlist-songs nesting), connections. Endpoints volgen het bestaande store-actiepatroon.
- **Schema** met foreign keys + `ON DELETE CASCADE` zodat het verwijderen van een song automatisch z'n setlist-koppels en connections opruimt — exact het gedrag dat de huidige store handmatig doet.
- **Frontend Zustand-store** verliest `persist` en `idb-keyval`. Wordt een dunne in-memory cache: bij app-start één `GET` per resource, daarna roepen actions de API aan en updaten state op response.
- **Vite proxy** `/api` → `localhost:3000` zodat er geen CORS-config nodig is.
- **Eén `npm run dev`** start beide processen (`concurrently`).
- **DB-bestand backup**: gewoon `cp data/mixmaster.db elders.db`. Geen verdere backup-UI nodig in deze change — de file is de backup.

## Capabilities

### New Capabilities

- `data-persistence`: Songs, setlists en connections worden bewaard in een SQLite-database op het filesystem (`data/mixmaster.db`), beheerd door een lokale Node-backend. Data overleeft browser-cache wipes, browser-wissels, OS-restarts en is back-up-baar door het kopiëren van het `.db`-bestand.

### Modified Capabilities

_(none — bestaande features blijven werken; alleen de opslagimplementatie verandert)_

## Impact

**Nieuw:**
- `server/index.ts` — Express app, mounting routes, JSON middleware
- `server/db.ts` — better-sqlite3 init, schema-creatie via migration-bestanden
- `server/migrations/001_initial.sql` — schema voor songs, setlists, setlist_songs, connections
- `server/routes/songs.ts`, `setlists.ts`, `connections.ts` — CRUD per resource
- `src/api/client.ts` — frontend fetch-wrapper, één functie per endpoint
- `data/.gitkeep` — directory voor de DB-file (DB zelf in `.gitignore`)

**Aangepast:**
- `src/store/useStore.ts` — geen `persist`, geen `idb-keyval`, geen `useStoreHydration`. Store heeft nu een `loaded`-flag en een `loadAll()` actie; CRUD-actions worden async en roepen API aan
- `src/App.tsx` — vervangen `useStoreHydration()` door `loadAll()` op mount, met dezelfde "Loading..."-fallback
- `vite.config.ts` — `server.proxy` voor `/api`, vaste `server.port: 5173` met `strictPort: true`
- `package.json` — dependencies (`express`, `better-sqlite3`, `concurrently`, types), `dev`-script start beide
- `.gitignore` — `data/*.db`, `data/*.db-journal`, `data/*.db-wal`
- Verwijderd: `idb-keyval` dependency, `useStoreHydration`-hook, alle `skipHydration`-logica

**Niet geraakt:**
- Components blijven dezelfde store-actions aanroepen — actions worden async maar de meeste callsites kunnen `void` blijven returnen. Plekken die expliciet op resultaat moeten wachten (ZIP-import die in batches schrijft) krijgen `await`.

## Risks

- **Async migratie:** alle store-actions worden async. Dit raakt veel componenten. Mitigatie: store-API blijft hetzelfde qua naam en parameters; alleen return wordt `Promise<void>`. Componenten die niet awaiten zien gewoon eventual consistency, wat voor deze app prima werkt.
- **Twee processen:** `npm run dev` start backend + frontend. Als één faalt moet duidelijk zijn welke. Mitigatie: `concurrently` met gekleurde prefixen.
- **Data-verlies van vóór deze change:** de huidige (lege) IndexedDB wordt niet gemigreerd — er is niets om te migreren. Als de gebruiker nog een CSV/ZIP heeft is re-import de weg terug.
- **Multi-device:** de DB-file is lokaal. Geen sync. Dat is bewust — sync staat los van deze change. Wie het op een andere machine wil zetten, kopieert het `.db`-bestand handmatig.
