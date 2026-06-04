# Rivalidazione cache Photography (Cloudinary)

Panoramica integrazione Cloudinary (cartelle, manifest, API): [cloudinary-photography.md](./cloudinary-photography.md).

Il sito memorizza in cache i risultati delle chiamate a Cloudinary (lista immagini per cartella) con `unstable_cache` e il tag `photography-cloudinary` (definito in `src/lib/cloudinary-server.js`). Le pagine sotto `/photography` possono quindi mostrare dati vecchi dopo che hai spostato, rinominato o aggiunto file su Cloudinary, oppure dopo aver cambiato il campo `folder` in `src/data/photography-galleries.js` e aver fatto deploy.

## Quando rivalidare

- Dopo modifiche alle **cartelle o agli asset** su Cloudinary usati dalle gallerie.
- Dopo un **deploy** che cambia `folder` o l’elenco gallerie, se in produzione vedi ancora elenchi o copertine non aggiornati (dipende da come è stata popolata la cache sul server).

## Prerequisito: `REVALIDATION_SECRET`

1. Nel file **`.env`** locale (e nelle **variabili d’ambiente** del progetto su Vercel) imposta una stringa segreta lunga e casuale, ad esempio:

   ```bash
   REVALIDATION_SECRET=la-tua-stringa-segreta-lunga
   ```

2. **Non** committare valori reali del segreto: `.env` deve restare fuori dal repository (è già in `.gitignore` se configurato correttamente).

3. Su Vercel, aggiungi la stessa variabile in **Project → Settings → Environment Variables** per Production (e Preview se serve).

## Procedura (UI del sito)

1. Apri nel browser (in produzione o in locale, a seconda di dove vuoi pulire la cache):

   **`/photography/revalidate-cache`**

   Esempio in produzione: `https://<tuo-dominio>/photography/revalidate-cache`

2. Nel campo **“Segreto di rivalidazione”** incolla **esattamente** lo stesso valore di `REVALIDATION_SECRET`.

3. Clicca **“Rigenera cache”**.

4. Se il segreto è corretto, vedrai un messaggio di successo. In caso di errore, controlla che `REVALIDATION_SECRET` sia impostato nell’ambiente in cui gira l’app e che non ci siano spazi extra copiati.

## Cosa fa l’azione server

Il form invia una **Server Action** (`src/app/photography/revalidate-cache/actions.js`) che:

1. Verifica che il segreto inviato coincida con `process.env.REVALIDATION_SECRET`.
2. Chiama `revalidateTag("photography-cloudinary")` per invalidare i dati in cache legati a Cloudinary.
3. Chiama `revalidatePath("/photography", "layout")` per far rigenerare le pagine sotto il segmento `/photography` (lista e dettaglio gallerie).

La route `/photography/revalidate-cache` ha `robots: noindex` nei metadata: non è pensata per l’indicizzazione.

## Note

- La pagina di rivalidazione è pensata per **chi conosce il segreto**; non condividere `REVALIDATION_SECRET` pubblicamente.
- Se cambi solo testi in `photography-galleries.js` (titoli, descrizioni) **senza** toccare Cloudinary, di solito basta un **nuovo deploy**: la rivalidazione serve soprattutto ai dati cachati dall’API Cloudinary e alle pagine che li incorporano.
