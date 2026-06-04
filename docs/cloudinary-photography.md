# Gallerie Photography con Cloudinary

Le gallerie fotografiche del sito non memorizzano le immagini nel repository: i **testi** (titolo, descrizione, slug) vivono in codice, mentre le **foto** sono asset su [Cloudinary](https://cloudinary.com) organizzati per cartella. Next.js le legge a build/runtime tramite l’Admin API e le espone su `/photography` e `/photography/[slug]`.

Documentazione correlata:

- [Rivalidazione cache dopo modifiche su Cloudinary](./revalidazione-cache-photography.md)

---

## Architettura

```mermaid
flowchart LR
  subgraph repo
    M[photography-galleries.js]
  end
  subgraph server
    L[cloudinary-server.js]
    C[(unstable_cache)]
  end
  subgraph cloud
    CL[Cloudinary Media Library]
  end
  subgraph pages
    P[/photography]
    D[/photography/slug]
  end
  M --> P
  M --> D
  P --> L
  D --> L
  L --> CL
  L --> C
  C --> P
  C --> D
```

| Ruolo | Percorso |
|-------|----------|
| Manifest gallerie (slug, testi, percorso cartella) | [`src/data/photography-galleries.js`](../src/data/photography-galleries.js) |
| Fetch API, URL delivery, cache tag | [`src/lib/cloudinary-server.js`](../src/lib/cloudinary-server.js) |
| Lista gallerie | [`src/app/photography/page.js`](../src/app/photography/page.js) |
| Dettaglio / slideshow | [`src/app/photography/[slug]/page.js`](../src/app/photography/[slug]/page.js) |
| Card in elenco | [`src/components/photography/PhotographyGalleryCard.js`](../src/components/photography/PhotographyGalleryCard.js) |
| Carosello | [`src/components/photography/GallerySlideshow.client.js`](../src/components/photography/GallerySlideshow.client.js) |
| Dominio immagini per `next/image` | [`next.config.mjs`](../next.config.mjs) (`res.cloudinary.com`) |

---

## Variabili d’ambiente

Imposta in `.env` / `.env.local` (locale) e nelle variabili del progetto su **Vercel** (Production e, se serve, Preview):

| Variabile | Obbligatoria | Descrizione |
|-----------|--------------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Sì | Nome cloud dal dashboard Cloudinary |
| `CLOUDINARY_API_KEY` | Sì | API Key |
| `CLOUDINARY_API_SECRET` | Sì | API Secret (solo server, mai esporre al client) |
| `REVALIDATION_SECRET` | Per rivalidare cache | Vedi [revalidazione cache](./revalidazione-cache-photography.md) |
| `PHOTOGRAPHY_ENABLE_PROBE` | No | Se `1`, sulla lista `/photography` compare un pannello di test API (solo dev/diagnostica) |
| `PHOTOGRAPHY_PROBE_PUBLIC_ID` | No | `public_id` usato dal probe (default `02_olvllg`) |

Senza le tre variabili `CLOUDINARY_*`, `isCloudinaryConfigured()` è falso: le pagine mostrano messaggi di errore o footnote sulle card invece delle copertine.

---

## Convenzioni su Cloudinary

### Struttura cartelle

Ogni galleria ha un campo `folder` nel manifest, ad esempio:

`Roberto Gianocca/Portfolio/Photography/Slava's Snowshow`

- Il percorso deve **coincidere** con la cartella reale in Media Library (inclusi spazi e apostrofi).
- Non aggiungere uno slash iniziale nel manifest.
- Le immagini della galleria devono stare **direttamente** in quella cartella (un solo segmento dopo il path della cartella nel `public_id`). Le sottocartelle non vengono incluse nel carosello.

### Copertina (`cover`)

Opzionale ma consigliata per la card in elenco:

- Carica un’immagine nella **stessa cartella** della galleria.
- L’**ultimo segmento** del `public_id` deve essere esattamente `cover` (es. `…/Photography/nome-galleria/cover`).
- La copertina viene usata sulla card (`800×600`, crop `fill`, `f_auto`, `q_auto`) e **non** entra nello slideshow.
- Senza `cover`, la card mostra un segnaposto; le altre foto restano comunque nella pagina dettaglio.

### Ordine e alt text

- Le slide sono ordinate per `public_id` (localeCompare).
- L’`alt` deriva dall’ultimo segmento del `public_id` (trattini/underscore → spazi). Per testi alt precisi, usa nomi file leggibili su Cloudinary.

### Altre immagini

Tutti gli asset nella cartella con ultimo segmento diverso da `cover` diventano slide. L’URL di delivery usa `secure_url` quando disponibile; altrimenti viene costruito con `buildCloudinaryImageUrl` (`f_auto`, `q_auto`, dimensioni limitate).

---

## Manifest: aggiungere una galleria

1. Crea la cartella su Cloudinary e carica le foto (+ eventuale `cover`).
2. Aggiungi una voce in [`src/data/photography-galleries.js`](../src/data/photography-galleries.js):

```js
{
  slug: "nome-url",
  title: "Titolo visibile",
  shortDescription: "Testo con **Markdown** inline, link [sito](https://…) o [pagina](/path).",
  folder: "Roberto Gianocca/Portfolio/Photography/Nome cartella",
}
```

3. Deploy (o avvio locale con env configurate). Le route `/photography/[slug]` sono generate staticamente da `generateStaticParams` (`dynamicParams: false`).
4. Se in produzione vedi ancora elenchi vecchi dopo aver cambiato solo file su Cloudinary, usa [rigenera cache](./revalidazione-cache-photography.md).

`shortDescription` supporta Markdown inline (grassetto, corsivo, link) renderizzato da `PhotographyRichDescription`.

---

## Come vengono lette le immagini (server)

In [`cloudinary-server.js`](../src/lib/cloudinary-server.js):

1. **Resources API** (REST Admin, prefisso cartella, paginazione `next_cursor`, fino a 500 risultati per batch).
2. Filtro sugli asset **solo nella cartella diretta** (`filterResourcesToDirectFolder`).
3. Se la lista è vuota, **fallback Search API** (`folder:"…"`).
4. Separazione cover / slide, costruzione oggetti `{ publicId, width, height, src, alt }`.

Le chiamate passano da `unstable_cache` (`fetchFolderAssets`) con tag `photography-cloudinary` e **nessuna scadenza automatica** (`revalidate: false`). Dopo modifiche su Cloudinary serve la rivalidazione manuale (documentata a parte).

Funzioni esposte:

| Funzione | Uso |
|----------|-----|
| `fetchFolderGallery(folder)` | Lista: cover + conteggio slide |
| `fetchFolderGalleryDetail(folder)` | Dettaglio: cover + array slide |
| `buildCloudinaryImageUrl(cloudName, publicId, opts)` | URL con trasformazioni stabili |
| `fetchCloudinaryResourceProbe(publicId)` | Diagnostica singolo asset (dev) |

---

## Presentazione nel sito

### Lista `/photography`

Server Component: per ogni voce del manifest chiama `fetchFolderGallery` e passa `coverSrc` a `PhotographyGalleryCard`. Eventuali errori (cartella vuota, env mancanti) compaiono come `footnote` sotto la card.

### Dettaglio `/photography/[slug]`

Carica `fetchFolderGalleryDetail`, poi `GallerySlideshow` (client): sidebar (titolo, descrizione, controlli, miniature) + immagine principale con `next/image`, rampa qualità e preload delle slide adiacenti.

### Immagini e performance

- `next/image` con `remotePatterns` verso `res.cloudinary.com`.
- Trasformazioni delivery: in genere `f_auto`, `q_auto` (vedi anche regola progetto `.cursor/rules/images-cloudinary-vercel.mdc`).
- Cache URL stabili: evitare combinazioni di transform diverse per lo stesso uso.

---

## Verifica in sviluppo (probe)

Con `PHOTOGRAPHY_ENABLE_PROBE=1`, la pagina lista mostra un aside che chiama `fetchCloudinaryResourceProbe` su `PHOTOGRAPHY_PROBE_PUBLIC_ID` (o default). Utile per confermare credenziali e un `public_id` noto. Non abilitare in produzione se non serve.

---

## Checklist operativa

| Azione | Cosa fare |
|--------|-----------|
| Nuova galleria | Cartella + file su Cloudinary → voce in `photography-galleries.js` → deploy |
| Solo nuove foto nella stessa cartella | Upload su Cloudinary → [rigenera cache](./revalidazione-cache-photography.md) |
| Rinomina/sposta cartella | Aggiorna `folder` nel manifest → deploy → rivalidazione se necessario |
| Cambio solo titolo/descrizione | Modifica manifest → deploy (non serve rivalidazione Cloudinary) |
| Copertina non compare | Verifica `public_id` che termina con `/cover` nella cartella giusta |

---

## Errori comuni

| Sintomo | Cause probabili |
|---------|-----------------|
| «Cloudinary non configurato» | `CLOUDINARY_*` assenti nell’ambiente di build/runtime |
| «Cartella vuota» / footnote sulla card | `folder` errato, cartella senza immagini, o asset solo in sottocartelle |
| «Nessuna immagine nella galleria» | Solo file `cover`, nessun’altra immagine nella cartella diretta |
| Dati vecchi in produzione | Cache `unstable_cache` non invalidata dopo upload su Cloudinary |
| Immagine non in `next/image` | URL non da `res.cloudinary.com` o dominio non in `next.config.mjs` |
