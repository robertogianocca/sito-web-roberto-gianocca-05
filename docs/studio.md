# Studio (area privata)

Area nascosta del sito per gestione operativa: **Archivio progetti** e **Time tracking**.

Raggiungibile solo con URL diretto e password. Non è indicizzata dai motori di ricerca.

**URL:** `/en/studio` o `/it/studio` (redirect a `/studio/archive`)  
**Login:** `/en/studio/login`  
**Sezioni:** `/en/studio/archive` · `/en/studio/time`

I vecchi URL `/en/archive` e `/it/archive` reindirizzano automaticamente a Studio.

---

## Variabili d’ambiente

In **`.env.local`** e su **Vercel → Settings → Environment Variables** (stesse dell’Archivio):

```bash
ARCHIVE_PASSWORD=la-tua-password
ARCHIVE_SESSION_SECRET=stringa-casuale-lunga
TURSO_DATABASE_URL=libsql://nome-db-....turso.io
TURSO_AUTH_TOKEN=eyJ...
```

`ARCHIVE_SESSION_SECRET` firma i token di sessione: usa una stringa casuale lunga (es. `openssl rand -hex 32`). Cambiarla disconnette tutti i dispositivi.

Il cookie di sessione resta `archive_session` (compatibilità con i deploy esistenti).

---

## Autenticazione e SEO

- **Sessione** (`src/lib/studio-auth.js`): il cookie contiene un token firmato (HMAC-SHA256 con `ARCHIVE_SESSION_SECRET`) che scade dopo 30 giorni. Il logout cancella il cookie; per invalidare tutte le sessioni aperte si cambia `ARCHIVE_SESSION_SECRET`.
- **Proxy** (`src/proxy.js`): le route `/studio` (tranne login) richiedono una sessione valida; altrimenti redirect al login. I path `/archive` vengono rediretti a `/studio/...`.
- **Layout Studio**: verifica di nuovo la sessione prima di leggere i dati, indipendentemente dal proxy.
- **Login / logout**: Server Action in `src/app/[locale]/studio/`. Password confrontata a tempo costante. Dopo 5 tentativi sbagliati in 15 minuti dallo stesso IP il login è bloccato fino alla fine della finestra (`src/lib/login-throttle.js`, tabella `login_attempts`; l'IP è salvato solo come hash).
- **API**: ogni route è avvolta in `withStudioAuth()` (`src/lib/studio-auth.js`), che risponde 401 senza sessione valida. In futuro potrà accettare anche un token Bearer per l'app Mac/mobile.
- **noindex**: header `X-Robots-Tag` su `/studio` e `/archive` in `next.config.mjs`.

---

## Interfaccia

- **Lingua:** lo Studio è solo in inglese, per scelta (è uno strumento privato). Date e orari usano ovunque `en-GB` (24 ore, giorno prima del mese): `STUDIO_LOCALE` e `plural()` in `src/lib/timeFormat.js`.
- **Telefono:** sotto i 768 px l'archivio mostra schede invece della tabella (`ArchiveCard`), i filtri sono dietro il pulsante "Filters" e l'ordinamento ha un selettore proprio (le intestazioni della tabella non si vedono). Il drawer del progetto passa a una colonna; i pulsanti piccoli hanno un'area di tocco più grande sui dispositivi touch (`TOUCH_TARGET` in `src/components/studio/ui/touch.js`).
- **Timer condiviso:** `TimerProvider` (nel layout Studio) tiene il timer per entrambe le schede. La scheda Time mostra `● 0:12:34` mentre il timer gira (ambra in pausa), e il Pomodoro si chiude allo scadere anche se la scheda Time non è aperta.
- **Orologio e hydration:** `useNow()` vale `null` sul server e durante l'hydration; in quel momento il tempo mostrato è `elapsedSeconds` calcolato dal server, poi parte l'orologio vivo. Così l'HTML del server e quello del browser coincidono.

## Archivio

Documentazione dettagliata: [archive.md](./archive.md).

L’UI vive sotto `/studio/archive` e riusa componenti e API `/api/archive/*`.

Le tab Archive | Time usano **keep-alive**: dopo il primo caricamento di ciascuna sezione, lo switch è istantaneo (le shell restano montate, nascoste). I progetti/settings sono in un provider condiviso nel layout Studio.

---

## Time tracking

Timer persistente sul server (Turso), inserimento manuale, Pomodoro 25 min, Today / Week / Projects / Report, export Excel/CSV.

### Funzionalità

| Feature | Dettaglio |
|---------|-----------|
| Timer | Start / Pause / Resume / Stop; un solo timer alla volta; dopo lo stop restano progetto/descrizione |
| Persistenza | Stato in tabella `time_timer`; elapsed da timestamp UTC. Lo stop è atomico: anche con richieste simultanee (doppio clic, due schede, controllo Pomodoro) si registra una sola voce |
| Fuso orario | “Oggi” e settimana sono calcolati in `Europe/Zurich` (`src/lib/timeZone.js`), indipendentemente dal fuso del server (UTC su Vercel) |
| Pomodoro | Opzionale; stop automatico dopo 25 min di tempo effettivo (le pause non contano); notifica browser + beep multi-tono |
| Manuale | Drawer: data + start/end oppure durata in ore |
| Progetti | Collegati ai progetti Archivio (`projectId`); selettore con ricerca |
| Today | Sezione Recent (ultime 5 coppie progetto + descrizione, con play) sopra l’elenco voci del giorno; play per ripartire sullo stesso progetto |
| Suggerimenti descrizione | Nel timer e nel drawer, la descrizione suggerisce quelle già usate sul progetto selezionato (autocomplete del browser disattivato) |
| Week | Timesheet lun–dom con navigazione settimane |
| Projects | Per progetto: totale ore + subtotale per descrizione (voci con la stessa descrizione sommate, espandibili; range date). Il play su una descrizione fa ripartire il timer su quel task. La matita su una descrizione la rinomina per tutte le voci del progetto, su tutte le date (e sul timer in corso se corrisponde) |
| Report | Totali per progetto e per cliente in un range date |
| Export | `/api/time/export?format=xlsx\|csv` (+ `from` / `to` opzionali) |

### Modello dati (Turso)

**`time_entries`** — voci chiuse  
`id`, `projectId`, `description`, `startedAt`, `endedAt`, `durationSeconds`, `source` (`timer` \| `manual` \| `pomodoro`), `createdAt`, `updatedAt`

**`time_timer`** — riga unica `id = current`  
`projectId`, `description`, `startedAt`, `pausedAt`, `pauseSeconds`, `pomodoroEnabled`, `pomodoroMinutes`

La colonna legacy `activityType` resta nelle tabelle ma non è più usata: una migrazione una tantum (`settings.activityToDescriptionMigrated`) ha copiato l’attività nella descrizione dove quest’ultima era vuota.

### API (protette da cookie)

Input validato con `src/lib/studio/schemas.js`: valori non validi → `400` con `{ error, issues }`; conflitti di stato del timer → `409`; voce inesistente → `404`. Dettagli in [archive.md](./archive.md#validazione).

| Route | Metodi | Descrizione |
|-------|--------|-------------|
| `/api/time/timer` | GET, POST | GET: stato timer (sola lettura). POST `action`: `start` \| `pause` \| `resume` \| `stop` \| `update` \| `checkPomodoro`; `stop` e `checkPomodoro` accettano `description` opzionale (testo non ancora salvato nella barra). Conflitti di stato (timer già avviato, già fermato) → 409 |
| `/api/time/entries` | GET, POST, PATCH | Lista (`view=today` \| `week`, oppure `from`/`to`; `today` include anche `recentTasks`); crea voce manuale; PATCH `{ projectId, from, to }` rinomina una descrizione su tutte le voci del progetto |
| `/api/time/entries/[id]` | PUT, DELETE | Aggiorna / elimina |
| `/api/time/report` | GET | Report aggregato (`from`, `to`) |
| `/api/time/export` | GET | Export file |
Risposta timer arricchita con `status`, `elapsedSeconds`, `pomodoroEndsAt` (utile per app native).

### File principali

| Percorso | Ruolo |
|----------|--------|
| `src/app/[locale]/studio/` | Login, layout a tab, pagine archive/time |
| `src/components/studio/StudioShell.js` | Tab Archive \| Time + logout |
| `src/components/time/` | UI time tracking |
| `src/lib/time.js` | Logica timer / entries / report |
| `src/lib/timeFormat.js` | Formatter durata (client-safe) |
| `src/lib/studio-auth.js` | Auth condivisa |
| `src/lib/turso.js` | Client Turso e `ensureInit()` (migrazioni in `src/lib/studio/migrations.js`) |

### Roadmap app Mac / mobile

- Stesse API REST JSON (non solo Server Actions)
- Timer sul server già pronto
- Auth: aggiungere `Authorization: Bearer` in `readRequestToken()` (`src/lib/studio-auth.js`) quando serve
- Timestamp ISO UTC già usati ovunque

---

## Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| Redirect loop su `/archive` | Atteso: usa `/studio/login` |
| Timer non persiste | Controlla Turso env; le tabelle si creano con le migrazioni al primo `ensureInit()` |
| Pomodoro non avvisa | Concedi notifiche browser; c’è comunque un beep |
