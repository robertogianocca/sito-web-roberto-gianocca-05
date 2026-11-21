# Archivio progetti (Archive)

Sistema privato per tenere traccia di tutti i progetti completati: dove sono archiviati, su quali dischi, stato pulizia/backup, clienti, tipologie, ecc.

Fa parte dell’area **Studio** (Archivio + Time tracking). Vedi anche [studio.md](./studio.md).

L’interfaccia è raggiungibile solo con URL diretto e password. Non è indicizzata dai motori di ricerca.

**URL (preferito):** `/en/studio/archive` o `/it/studio/archive`  
**Login:** `/en/studio/login`  
**Legacy:** `/en/archive` e `/it/archive` reindirizzano a Studio.

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

Al primo accesso, `ensureInit()` in `src/lib/turso.js` applica le migrazioni dello schema (`src/lib/studio/migrations.js`): crea le tabelle e popola le impostazioni di default da `src/data/archive/config.js`. Vedi [Migrazioni](#migrazioni-dello-schema).

---

## Autenticazione e SEO

- **Proxy** (`src/proxy.js`): le route `/studio` (tranne login) richiedono una sessione valida nel cookie `archive_session`; altrimenti redirect al login. I path legacy `/archive` reindirizzano a `/studio/...`.
- **Login** (`src/app/[locale]/studio/login/`): Server Action imposta un token firmato in un cookie HttpOnly, `secure` in produzione, valido 30 giorni. Dettagli e limite ai tentativi in [studio.md](./studio.md#autenticazione-e-seo).
- **API**: ogni route è avvolta in `withStudioAuth()` di `src/lib/studio-auth.js`.
- **noindex**: header `X-Robots-Tag: noindex, nofollow` in `next.config.mjs` per le route studio e archive.

Se sembra che l’archivio non sia protetto, prova in finestra anonima: potresti avere già un cookie di sessione valido.

---

## Funzionalità

### Tabella progetti

- Ricerca per titolo, cliente, ID progetto, numero fattura, tag
- Filtri per tipologia, anno (estratto dalla data testuale), stato, disco archivio
- Con filtro su un disco specifico: riepilogo capacità / usato / libero (vedi sotto)
- Ordinamento per data, cliente, ID
- Colori riga per stato:
  - **Not archived** — nessun disco archivio
  - **Incomplete** — disco impostato, pulizia/backup non completati
  - **In progress** — almeno uno tra pulizia e backup completato
  - **Complete** — pulizia e backup entrambi completati (backup = Full o Export)

### Tipo backup

Nel form progetto, **Backup type** ha tre stati:

| Valore | Significato |
|--------|-------------|
| None | Non ancora backuppato |
| Full | Backup completo con file originali |
| Export | Solo file esportati / deliverable |

Entrambi Full e Export contano come backup completato per i colori riga (**In progress** / **Complete**). La colonna tabella **Backup** mostra `Full`, `Export` o `—`.

**Migrazione:** i progetti con il vecchio flag `backupCompleted` attivo sono stati convertiti in `backupType = full` al primo avvio dopo l’aggiornamento.

### Capacità dischi

In Impostazioni, ogni drive ha un campo **capacity** (testo libero, es. `4 TB`).

Quando filtri per un singolo Archive drive, sotto i filtri compare un riepilogo:
`Archive 01 · 2.1 TB used · 1.9 TB free of 4 TB`.

**Regola di calcolo dello spazio usato:** viene sommata solo la `size` dei progetti che hanno **esattamente un** Archive drive, uguale al disco filtrato. I progetti con più Archive drive non contano nell’uso. Size vuote o non parseabili contano come 0. Se la capacity non è impostata, viene mostrato solo l’usato.

### Form progetto (drawer)

Campi principali: Project ID, Invoice #, Title, Client, Type, Date (testo libero, es. `Maggio 2026`), Location, Archive drive, Backup drive, Size, Cleaned, Paid, Backup type, Contact, Notes, Tags.

**Pagamento:** checkbox **Paid** in Status (attiva di default). Se disattivata, nella tabella compare **$** accanto al titolo (dopo l’icona note, se presente).

**Multi-selezione:** Client, Type, Archive drive e Backup drive accettano più valori (array salvati come JSON nel DB).

**Creazione inline:** Client, Type e Archive drive permettono di aggiungere un nuovo valore direttamente dal form progetto (salvato nelle impostazioni). Backup drive usa la stessa lista dischi di Archive drive.

### Impostazioni (icona ingranaggio)

Gestione in pagina di:

- Project Types
- Drives (lista condivisa per Archive drive e Backup drive; ogni drive può avere una capacity)
- Clients

Ogni lista: pill rimovibili, rinomina inline (click sul nome), aggiunta con input + Add. I drive mostrano anche un campo capacity.

**Rinomina a cascata:** quando rinomini un elemento e clicchi Save, tutti i progetti che usano il vecchio nome vengono aggiornati automaticamente (es. `Drone` → `Drone Video` su tutti i progetti con quel type). La rinomina di un disco aggiorna sia `archiveDrive` sia `backupDrive`.

**Uso delle voci:** accanto a ogni tipo, disco e cliente c'è il numero di progetti che lo usano (contato dai progetti già caricati). Togliendo una voce in uso viene chiesto se toglierla **anche dai progetti** o **solo dalla lista** (per un disco, tenerla sui progetti conserva dove sono stati archiviati). I nomi usati dai progetti ma assenti dalla lista compaiono sotto "Used in projects but not in this list", con un pulsante per rimetterli. Un nome già presente con maiuscole diverse ("anna" / "Anna") non viene aggiunto e un messaggio lo segnala.

**Rinomine e rimozioni esatte:** nei progetti i valori si sostituiscono o tolgono elemento per elemento con le funzioni JSON di SQLite (`json_each`), quindi funzionano anche con nomi che contengono virgolette o barre; un progetto che aveva già il nuovo nome lo tiene una volta sola.

**Eliminare un progetto:** prima della conferma viene mostrato quanto tempo è registrato sul progetto (`GET /api/archive/[id]/time`); le voci di tempo restano, sotto "No project".

**Salvataggio in un'unica transazione:** il Save delle impostazioni invia liste, rinomine e lista clienti in una sola richiesta; il server salva tutto o niente. Allo stesso modo, salvando un progetto con un cliente, tipo o disco nuovo, il valore viene aggiunto alla lista insieme al progetto.

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

Chiavi `projectTypes`, `archiveDrives` (JSON array) e `driveCapacities` (JSON object nome → capacity, es. `{"Archive 01":"4 TB"}`). Archive drive e Backup drive sul progetto usano la stessa lista `archiveDrives`. Eventuali valori legacy in `backupDrives` sono stati uniti in `archiveDrives` una volta, dalla migrazione 3. La tabella contiene anche righe interne (segnali di vecchie migrazioni) che l'API non restituisce.

### Seed iniziale

Alla prima esecuzione, i default provengono da `src/data/archive/config.js`. Dopo il primo avvio le liste vivono nel DB e si modificano dall’UI Impostazioni.

---

## Migrazioni dello schema

Lo schema del database è gestito da migrazioni versionate in `src/lib/studio/migrations.js`; la tabella `schema_migrations` registra quelle già applicate. `ensureInit()` le applica alla prima richiesta di ogni istanza del server: se il database è aggiornato costa una sola query.

Per cambiare lo schema si aggiunge una migrazione in fondo a `MIGRATIONS`, con il numero successivo; quelle già pubblicate non si modificano. Ogni migrazione deve essere:

- **ripetibile senza danni** (`IF NOT EXISTS`, `OR IGNORE`, aggiornamenti condizionati), perché due istanze possono partire insieme;
- **compatibile con il codice già online**, perché le anteprime Vercel usano lo stesso database di produzione e applicano la migrazione appena vengono aperte, prima che la modifica sia unita.

## Validazione

Ogni API valida l'input con gli schemi di `src/lib/studio/schemas.js`. I campi sconosciuti vengono ignorati; un valore non valido produce `400` con `{ error, issues }` (es. `title: Invalid input: expected string, received number`). Gli errori interni rispondono `500` con un messaggio generico; il dettaglio finisce solo nei log.

---

## API (tutte protette da cookie sessione)

| Route | Metodi | Descrizione |
|-------|--------|-------------|
| `/api/archive` | GET, POST | Lista / crea progetti |
| `/api/archive/[id]/time` | GET | Tempo registrato sul progetto: `{ entryCount, totalSeconds }` |
| `/api/archive/[id]` | PATCH, PUT, DELETE | Aggiorna solo i campi inviati (PUT è un alias di PATCH) / elimina progetto |
| `/api/archive/clients` | GET, POST, PUT, DELETE | Clienti; PUT `{ from, to }` rinomina nella lista e nei progetti, in una transazione |
| `/api/archive/settings` | GET, PUT | Impostazioni (`projectTypes`, `archiveDrives`, `driveCapacities`). PUT accetta anche `renames` (`projectTypes`, `archiveDrives`, `clients`), `removals` (valori da togliere anche dai progetti) e la lista finale `clients`, salvati in una transazione |
| `/api/archive/export` | GET | Export `?format=xlsx` o `?format=csv` |

---

## Locale vs Vercel

- **Un solo database Turso** condiviso tra locale e Vercel: i dati sono sempre gli stessi se le env vars puntano allo stesso DB.
- Modifiche su preview Vercel sono persistenti (a differenza del vecchio storage JSON su filesystem).
- Per backup aggiuntivo: usa Export → Excel/CSV.

---

## File coinvolti

| Percorso | Ruolo |
|----------|--------|
| `src/lib/turso.js` | Client Turso, `ensureInit()` |
| `src/lib/studio/migrations.js` | Migrazioni versionate dello schema |
| `src/lib/studio/schemas.js` | Validazione degli input delle API (zod) |
| `src/lib/studio/errors.js` | Errori restituiti dalle API (400, 404) |
| `src/lib/archive.js` | CRUD progetti, clienti, settings, `cascadeFieldRename()` |
| `src/lib/studio-auth.js` | Sessione firmata e `withStudioAuth()` (Studio) |
| `src/lib/login-throttle.js` | Limite ai tentativi di login |
| `src/proxy.js` | Auth middleware per route studio + redirect legacy archive |
| `src/app/[locale]/studio/(app)/archive/` | Pagina archivio |
| `src/app/[locale]/studio/login/` | Login Studio |
| `src/components/archive/` | UI (tabella, drawer, settings, filtri, export) |
| `src/components/studio/StudioShell.js` | Tab Archive \| Time + logout |
| `src/data/archive/config.js` | Default iniziali (solo seed) |
| `next.config.mjs` | Header noindex studio/archive |
| `docs/studio.md` | Area Studio completa (time tracking incluso) |

---

## Troubleshooting

| Problema | Causa probabile | Soluzione |
|----------|-----------------|-----------|
| `LibsqlError: HTTP 400` | Token Turso errato | Il token deve iniziare con `eyJ`; controlla typo in `.env` e Vercel |
| `TURSO_DATABASE_URL is not set` | Env mancante | Aggiungi variabili e riavvia `npm run dev` |
| Archive non protetto | Cookie sessione già presente | Prova finestra anonima |
| Rinomina type non aggiorna progetti | Save non cliccato | Le rename in Settings si applicano solo al click Save |
| API 404 su `/en/api/archive` | Matcher proxy | Le API sono escluse dal prefisso locale in `proxy.js` |
