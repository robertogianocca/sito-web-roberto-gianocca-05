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

Il cookie di sessione resta `archive_session` (compatibilità con i deploy esistenti).

---

## Autenticazione e SEO

- **Proxy** (`src/proxy.js`): le route `/studio` (tranne login) richiedono il cookie; altrimenti redirect al login. I path `/archive` vengono rediretti a `/studio/...`.
- **Login / logout**: Server Action in `src/app/[locale]/studio/`.
- **API**: helper `isStudioAuthenticated()` in `src/lib/studio-auth.js` (cookie; in futuro potrà accettare anche Bearer token per app Mac/mobile).
- **noindex**: header `X-Robots-Tag` su `/studio` e `/archive` in `next.config.mjs`.

---

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
| Timer | Start / Pause / Resume / Stop; un solo timer alla volta; dopo lo stop restano progetto/descrizione/attività |
| Persistenza | Stato in tabella `time_timer`; elapsed da timestamp UTC |
| Pomodoro | Opzionale; stop automatico dopo 25 min di tempo effettivo (le pause non contano); notifica browser + beep multi-tono |
| Manuale | Drawer: data + start/end oppure durata in ore |
| Progetti | Collegati ai progetti Archivio (`projectId`); selettore con ricerca |
| Activity types | Lista in Impostazioni Tempo (seed: Working, Shooting, Editing, Motion, Meeting, Admin, Travel) |
| Today | Totale giorno + elenco voci; play per ripartire sullo stesso progetto |
| Week | Timesheet lun–dom con navigazione settimane |
| Projects | Per progetto: totale ore + sotto-lista task (range date) |
| Report | Totali per progetto e per cliente in un range date |
| Export | `/api/time/export?format=xlsx\|csv` (+ `from` / `to` opzionali) |

### Modello dati (Turso)

**`time_entries`** — voci chiuse  
`id`, `projectId`, `description`, `activityType`, `startedAt`, `endedAt`, `durationSeconds`, `source` (`timer` \| `manual` \| `pomodoro`), `createdAt`, `updatedAt`

**`time_timer`** — riga unica `id = current`  
`projectId`, `description`, `activityType`, `startedAt`, `pausedAt`, `pauseSeconds`, `pomodoroEnabled`, `pomodoroMinutes`

**`settings.activityTypes`** — JSON array

### API (protette da cookie)

| Route | Metodi | Descrizione |
|-------|--------|-------------|
| `/api/time/timer` | GET, POST | Stato timer; POST `action`: `start` \| `pause` \| `resume` \| `stop` \| `update` \| `checkPomodoro` |
| `/api/time/entries` | GET, POST | Lista (`view=today` \| `week`, oppure `from`/`to`); crea voce manuale |
| `/api/time/entries/[id]` | PUT, DELETE | Aggiorna / elimina |
| `/api/time/report` | GET | Report aggregato (`from`, `to`) |
| `/api/time/export` | GET | Export file |
| `/api/time/settings` | GET, PUT | Tipi attività |

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
| `src/lib/turso.js` | Schema tabelle time |

### Roadmap app Mac / mobile

- Stesse API REST JSON (non solo Server Actions)
- Timer sul server già pronto
- Auth: aggiungere `Authorization: Bearer` in `isStudioAuthenticated` quando serve
- Timestamp ISO UTC già usati ovunque

---

## Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| Redirect loop su `/archive` | Atteso: usa `/studio/login` |
| Timer non persiste | Controlla Turso env; le tabelle si creano al primo `ensureInit()` |
| Pomodoro non avvisa | Concedi notifiche browser; c’è comunque un beep |
