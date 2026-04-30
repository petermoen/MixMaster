## 1. Backend setup

- [ ] 1.1 Dependencies toevoegen: `express`, `better-sqlite3`, `cors` (voor de zekerheid), `concurrently`, `tsx`. DevTypes: `@types/express`, `@types/better-sqlite3`
- [ ] 1.2 `server/db.ts` — better-sqlite3 init: `data/mixmaster.db`, `PRAGMA foreign_keys = ON`, `PRAGMA journal_mode = WAL`. Run-on-start migration die `server/migrations/*.sql` op alfabetische volgorde uitvoert (idempotent met `CREATE TABLE IF NOT EXISTS`)
- [ ] 1.3 `server/migrations/001_initial.sql` — tables: `songs`, `setlists`, `setlist_songs`, `connections` met foreign keys + `ON DELETE CASCADE`
- [ ] 1.4 `server/index.ts` — Express app, `express.json({ limit: '10mb' })` voor grote ZIP-imports, mount routes onder `/api`
- [ ] 1.5 `package.json` script: `"dev:server": "tsx watch server/index.ts"`
- [ ] 1.6 `.gitignore`: `data/*.db`, `data/*.db-wal`, `data/*.db-shm`, `data/*.db-journal`

## 2. REST routes

- [ ] 2.1 `server/routes/songs.ts` — `GET /api/songs`, `POST /api/songs`, `POST /api/songs/batch`, `PATCH /api/songs/:id`, `DELETE /api/songs/:id`
- [ ] 2.2 `server/routes/setlists.ts` — `GET /api/setlists` (inclusief songs[] gejoind), `POST /api/setlists`, `PATCH /api/setlists/:id`, `DELETE /api/setlists/:id`, `POST /api/setlists/:id/songs` (toevoegen), `DELETE /api/setlists/:id/songs/:songId` (verwijderen), `PATCH /api/setlists/:id/songs/:songId` (cue/notes update), `PUT /api/setlists/:id/songs` (reorder — vervangt hele lijst)
- [ ] 2.3 `server/routes/connections.ts` — `GET /api/connections`, `POST /api/connections`, `POST /api/connections/batch`, `DELETE /api/connections/:id`
- [ ] 2.4 `DELETE /api/songs/:id` test: setlist_songs en connections worden via cascade opgeruimd
- [ ] 2.5 Alle write-routes wrappen in een better-sqlite3 transaction

## 3. Vite frontend integratie

- [ ] 3.1 `vite.config.ts` — `server.port: 5173`, `server.strictPort: true`, `server.proxy: { '/api': 'http://localhost:3030' }`
- [ ] 3.2 `package.json` script: `"dev": "concurrently -n server,web -c yellow,cyan \"npm run dev:server\" \"vite\""`
- [ ] 3.3 README sectie: hoe app starten (`npm install`, `npm run dev`), waar DB-file staat, hoe te backuppen

## 4. Frontend API-client

- [ ] 4.1 `src/api/client.ts` — fetch-wrapper met basisfouten-afhandeling: gooit op non-2xx, parse JSON op success
- [ ] 4.2 Eén exported object per resource (`songsApi`, `setlistsApi`, `connectionsApi`) met functies die 1-op-1 corresponderen met de routes
- [ ] 4.3 Types in `src/api/client.ts` matchen de bestaande `Song`, `Setlist`, `SetlistSong`, `Connection` interfaces (geen velden hernoemen — de API geeft camelCase terug, mapping gebeurt server-side bij DB-rij naar JSON)

## 5. Zustand-store omschrijven

- [ ] 5.1 `idb-keyval` dependency en alle import-statements verwijderen
- [ ] 5.2 `persist`-middleware en `createJSONStorage`-blok verwijderen uit `src/store/useStore.ts`
- [ ] 5.3 `useStoreHydration`-hook en `useStore.persist.rehydrate()`-call verwijderen
- [ ] 5.4 Store krijgt `loaded: boolean` en `loadAll(): Promise<void>` die `GET /api/songs`, `GET /api/setlists`, `GET /api/connections` parallel doet en state vult
- [ ] 5.5 Alle CRUD-actions worden async: roep eerst de API, gebruik response om state te updaten. Houd de bestaande functienamen en parameters
- [ ] 5.6 Voor setlist-song-mutaties (add/remove/update/reorder): backend retourneert de bijgewerkte setlist (incl. songs[]); frontend vervangt de setlist in state op id

## 6. App-bootstrap

- [ ] 6.1 In `src/App.tsx`: vervang `const hydrated = useStoreHydration()` door `const loaded = useStore((s) => s.loaded)` en een `useEffect(() => { useStore.getState().loadAll() }, [])`
- [ ] 6.2 Behoud de "Loading..."-fallback exact zoals die nu is, gating op `loaded`
- [ ] 6.3 Bij API-fout tijdens `loadAll`: toon foutmelding "Kan geen verbinding maken met de lokale server. Draait `npm run dev`?" in plaats van een eindeloze loader

## 7. Verificatie

- [ ] 7.1 `npm install` slaagt; `npm run dev` start zowel backend als frontend
- [ ] 7.2 Eerste run: `data/mixmaster.db` wordt aangemaakt, app laadt met lege state, geen errors in console
- [ ] 7.3 Voeg een song toe → check dat row in DB staat (`sqlite3 data/mixmaster.db "SELECT * FROM songs"`)
- [ ] 7.4 Voeg setlist toe, voeg songs toe aan setlist met cue points en notes → reorder → check `setlist_songs` rows met juiste `position`-waarden
- [ ] 7.5 Verwijder een song die in een setlist en in connections gebruikt wordt → check dat setlist_songs- en connections-rows automatisch weg zijn (cascade)
- [ ] 7.6 Stop beide processen, kopieer `data/mixmaster.db` naar `mixmaster-backup.db`, restart computer, start opnieuw → data is er nog
- [ ] 7.7 ZIP-import via bestaande `zipImporter`-flow blijft werken (mogelijk batch endpoint nodig — zie taak 2.1/2.3)
- [ ] 7.8 CSV-import idem
- [ ] 7.9 Geen verwijzingen naar `idb-keyval`, `persist`, of `useStoreHydration` meer in de codebase (`grep -r` check)
