# Archivio progetti (Archive)

Sistema privato per tenere traccia di tutti i progetti completati: dove sono archiviati, su quali dischi, stato pulizia/backup, clienti, tipologie, ecc.

L’interfaccia è raggiungibile solo con URL diretto e password. Non è indicizzata dai motori di ricerca.

**URL:** `/en/archive` o `/it/archive`  
**Login:** `/en/archive/login` (o `/it/archive/login`)

---

## Variabili d’ambiente

In **`.env.local`** (locale) e in **Vercel → Settings → Environment Variables**:

```bash
# Autenticazione
ARCHIVE_PASSWORD=la-tua-password
ARCHIVE_SESSION_SECRET=stringa-casuale-lunga

# Database Turso (SQLite hosted)
TURSO_DATABASE_URL=libsql://nome-db-....turso.io
TURSO_AUTH_TOKEN=eyJ...
```

| Variabile | Ruolo |
|-----------|--------|
| `ARCHIVE_PASSWORD` | Password inserita nel form di login |
| `ARCHIVE_SESSION_SECRET` | Valore del cookie di sessione (deve coincidere tra login e middleware) |
| `TURSO_DATABASE_URL` | URL del database Turso |
| `TURSO_AUTH_TOKEN` | Token JWT — deve iniziare con `eyJ`, non `eeyJ` |

**Non** committare valori reali: `.env*` è in `.gitignore`.

---

## Setup Turso (una tantum)

1. Account su [turso.tech](https://turso.tech)
2. `brew install tursodatabase/tap/turso`
3. `turso auth login`
4. `turso db create archive`
5. `turso db show archive --url` → copia in `TURSO_DATABASE_URL`
6. `turso db tokens create archive` → copia in `TURSO_AUTH_TOKEN`
7. Aggiungi le stesse variabili su Vercel e ridistribuisci

Al primo accesso, `ensureInit()` in `src/lib/turso.js` crea le tabelle e popola le impostazioni di default da `src/data/archive/config.js`.

---

## Autenticazione e SEO

- **Proxy** (`src/proxy.js`): le route `/archive` (tranne login) richiedono il cookie `archive_session` uguale a `ARCHIVE_SESSION_SECRET`; altrimenti redirect al login.
- **Login** (`src/app/[locale]/archive/login/`): Server Action imposta cookie HttpOnly, `secure` in produzione, durata 30 giorni.
- **noindex**: header `X-Robots-Tag: noindex, nofollow` in `next.config.mjs` per le route archive.

Se sembra che l’archivio non sia protetto, prova in finestra anonima: potresti avere già un cookie di sessione valido.

---

## Funzionalità

### Tabella progetti

- Ricerca per titolo, cliente, ID progetto, numero fattura, tag
- Filtri per tipologia, anno (estratto dalla data testuale), stato
- Ordinamento per data, cliente, ID
- Colori riga per stato:
  - **Not archived** — nessun disco archivio
  - **Incomplete** — disco impostato, pulizia/backup non completati
  - **In progress** — almeno uno tra pulizia e backup completato
  - **Complete** — pulizia e backup entrambi completati

### Form progetto (drawer)

Campi principali: Project ID, Invoice #, Title, Client, Type, Date (testo libero, es. `Maggio 2026`), Location, Archive drive, Backup drive, Cleaned, Backup completed, Notes, Tags.

**Multi-selezione:** Client, Type, Archive drive e Backup drive accettano più valori (array salvati come JSON nel DB).

### Impostazioni (icona ingranaggio)

Gestione in pagina di:

- Project Types
- Archive Drives
- Backup Drives
- Clients

Ogni lista: pill rimovibili, rinomina inline (click sul nome), aggiunta con input + Add.

**Rinomina a cascata:** quando rinomini un elemento e clicchi Save, tutti i progetti che usano il vecchio nome vengono aggiornati automaticamente (es. `Drone` → `Drone Video` su tutti i progetti con quel type).

### Export

Pulsante Export → `.xlsx` o `.csv` con tutti i campi del progetto.

---

## Modello dati (Turso)

### Tabella `projects`

Un record per progetto. Campi multi-valore (`client`, `type`, `archiveDrive`, `backupDrive`, `tags`) sono stringhe JSON, es. `["Archive 01","NAS"]`.

Valori legacy (stringa singola) vengono convertiti in array alla lettura tramite `parseArrayField()` in `src/lib/archive.js`.

### Tabella `clients`

Elenco nomi clienti (`name TEXT PRIMARY KEY`).

### Tabella `settings`

Chiavi `projectTypes`, `archiveDrives`, `backupDrives` — valori JSON array.

### Seed iniziale

Alla prima esecuzione, i default provengono da `src/data/archive/config.js`. Dopo il primo avvio le liste vivono nel DB e si modificano dall’UI Impostazioni.

---

## API (tutte protette da cookie sessione)

| Route | Metodi | Descrizione |
|-------|--------|-------------|
| `/api/archive` | GET, POST | Lista / crea progetti |
| `/api/archive/[id]` | PUT, DELETE | Aggiorna / elimina progetto |
| `/api/archive/clients` | GET, POST, PUT, DELETE | Clienti; PUT rinomina con cascade |
| `/api/archive/settings` | GET, PUT | Impostazioni; PUT accetta `renames` per cascade |
| `/api/archive/export` | GET | Export `?format=xlsx` o `?format=csv` |
| `/api/archive/migrate` | POST | Migrazione una tantum da JSON locali |

---

## Locale vs Vercel

- **Un solo database Turso** condiviso tra locale e Vercel: i dati sono sempre gli stessi se le env vars puntano allo stesso DB.
- Modifiche su preview Vercel sono persistenti (a differenza del vecchio storage JSON su filesystem).
- Per backup aggiuntivo: usa Export → Excel/CSV.

### Migrazione da JSON (solo se avevi dati in `src/data/archive/*.json`)

Dopo il deploy, una volta autenticato:

```js
await fetch('/api/archive/migrate', { method: 'POST' }).then(r => r.json())
```

Poi puoi ignorare i file JSON legacy.

---

## File coinvolti

| Percorso | Ruolo |
|----------|--------|
| `src/lib/turso.js` | Client Turso, `ensureInit()`, creazione tabelle |
| `src/lib/archive.js` | CRUD progetti, clienti, settings, `cascadeFieldRename()` |
| `src/proxy.js` | Auth middleware per route archive |
| `src/app/[locale]/archive/` | Pagina, login, logout |
| `src/components/archive/` | UI (tabella, drawer, settings, filtri, export) |
| `src/data/archive/config.js` | Default iniziali (solo seed) |
| `next.config.mjs` | Header noindex archive |

---

## Troubleshooting

| Problema | Causa probabile | Soluzione |
|----------|-----------------|-----------|
| `LibsqlError: HTTP 400` | Token Turso errato | Il token deve iniziare con `eyJ`; controlla typo in `.env` e Vercel |
| `TURSO_DATABASE_URL is not set` | Env mancante | Aggiungi variabili e riavvia `npm run dev` |
| Archive non protetto | Cookie sessione già presente | Prova finestra anonima |
| Rinomina type non aggiorna progetti | Save non cliccato | Le rename in Settings si applicano solo al click Save |
| API 404 su `/en/api/archive` | Matcher proxy | Le API sono escluse dal prefisso locale in `proxy.js` |
