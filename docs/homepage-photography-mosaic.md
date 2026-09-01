# Sezione Photography in homepage

La sezione Photography nella homepage mostra un **mosaico asimmetrico** con carosello automatico, due slot laterali statici e una riga di thumbnail delle gallerie più recenti.

Documentazione correlata:

- [Gallerie Photography su Cloudinary](./cloudinary-photography.md)
- [Rivalidazione cache Photography](./revalidazione-cache-photography.md)

---

## Layout visivo

Da `lg` in su (griglia a 2 colonne):

```
┌─────────────────────────────┬─────────────┐
│                             │  Slot B     │  ← altra galleria (cover)
│  Slot A  (carosello)        ├─────────────┤
│                             │  Slot C     │  ← altra galleria (cover)
├─────────────────────────────┘             │
│  Titolo · Descrizione · Vedi galleria →   │  (larghezza = solo slot A)
└───────────────────────────────────────────┘
[ Thumb 1 ]  [ Thumb 2 ]  [ Thumb 3 ]   Tutte le gallerie →
```

Sotto `lg` la griglia diventa **una colonna sola** e l'ordine passa a slot A → testo → slot B/C (via utility `order-*`). Con due colonne fisse su schermo stretto lo slot A scendeva a ~190px di larghezza. Stessa logica in `HomeFeaturedVideo`, che impila player e testo sotto `lg`.

La riga thumbnail è il componente condiviso [`HomeThumbRow`](../src/components/home/HomeThumbRow.js), usato identico nella sezione Video: sotto `sm` il link «tutte» scende sotto la griglia invece di stringerla.

| Elemento | Fonte dati | Comportamento |
|----------|------------|---------------|
| Slot A | galleria con `featured: true` | Carosello crossfade ogni 4s |
| Testo sotto slot A | `title`, `shortDescription` della featured | Solo sotto slot A (stessa larghezza) |
| Slot B / Slot C | prime 2 gallerie non-featured | Cover statica con overlay titolo; se mancano, si usano immagini del carosello come fallback |
| Riga thumbnail | gallerie successive agli slot B/C, fino a 3 | Stessa proporzione di slot A |
| Link "Tutte le gallerie →" | — | Sempre visibile, allineato a destra della riga thumbnail |

---

## File coinvolti

| Ruolo | Percorso |
|-------|----------|
| Manifest gallerie (dati, proporzioni, immagini) | [`src/data/photography-galleries.js`](../src/data/photography-galleries.js) |
| Preparazione dati server (fetch Cloudinary, crop, fill slot) | [`src/lib/home-photography-data.js`](../src/lib/home-photography-data.js) |
| Composizione della sezione in homepage | [`src/app/[locale]/page.js`](../src/app/%5Blocale%5D/page.js) |
| Componente mosaico (carosello crossfade, grid) | [`src/components/photography/HomePhotographyMosaic.client.js`](../src/components/photography/HomePhotographyMosaic.client.js) |
| Componente thumbnail recenti | [`src/components/photography/HomeGalleryThumb.js`](../src/components/photography/HomeGalleryThumb.js) |

---

## Campi del manifest (`photography-galleries.js`)

I campi rilevanti per la homepage si aggiungono alla struttura base della galleria:

```js
{
  slug: "nome-url",
  title: { it: "Titolo IT", en: "Title EN" },
  shortDescription: { it: "…", en: "…" },
  folder: "Roberto Gianocca/Portfolio/Photography/Nome cartella",

  // ── Homepage ──────────────────────────────────────────────
  featured: true,           // marca questa galleria come "in evidenza" (slot A)
  homeImageAspect: "4/3",   // proporzione contenitore slot A e thumbnail
  homeImageCount: 4,        // quante immagini caricare per il carosello (default 4)
  homeImages: [             // (opzionale) public_id specifici da usare nel carosello
    "Roberto Gianocca/Portfolio/Photography/Galleria/01_abc",
    "Roberto Gianocca/Portfolio/Photography/Galleria/05_xyz",
  ],
}
```

### `featured`

- La prima galleria con `featured: true` diventa lo **slot A** (carosello).
- Se nessuna è marcata, si usa `PHOTOGRAPHY_GALLERIES[0]`.
- Le prime 2 gallerie **non-featured** diventano slot B e C.
- Le successive (fino a 3) formano la riga di thumbnail.

### `homeImageAspect`

Controlla la proporzione del contenitore dello slot A **e** delle thumbnail.

| Valore | Formato | Note |
|--------|---------|------|
| `"4/3"` | Orizzontale | Default consigliato |
| `"2/3"` | Verticale | — |
| `"4/5"` | Verticale | — |

Il server calcola automaticamente le dimensioni del crop Cloudinary in base a questo valore:

```js
// In page.js — crop proporzionato all'aspect scelto
const [wRatio, hRatio] = (featuredGallery.homeImageAspect ?? "4/3").split("/").map(Number);
const cropW = 1200;
const cropH = Math.round((cropW * hRatio) / wRatio);
// → 4/3: 1200×900 · 2/3: 1200×1800 · 4/5: 1200×1500
```

Le immagini del carosello usano `object-contain` su fondo nero, e il crop Cloudinary è `crop: "fit"`: l'immagine **non** viene tagliata, quindi se le proporzioni non coincidono con `homeImageAspect` restano bande nere ai lati. È voluto — meglio una banda che un soggetto tagliato. Gli slot B e C, decorativi, usano invece `object-cover`.

### `homeImages`

Array di `public_id` Cloudinary che specifica **quali immagini** usare nel carosello homepage, indipendentemente dall'ordine della cartella.

```js
homeImages: [
  "Roberto Gianocca/Portfolio/Photography/Slava's Snowshow/03_abc123",
  "Roberto Gianocca/Portfolio/Photography/Slava's Snowshow/07_xyz456",
]
```

- Se omesso (o array vuoto), vengono prese le prime `homeImageCount` slide della cartella tramite `fetchFolderGalleryDetail`.
- `homeImageCount` (default `4`) è ignorato quando `homeImages` è presente.

---

## Carosello crossfade (componente)

Il carosello in `HomePhotographyMosaic.client.js` cicla le immagini ogni **4 secondi** con un fade incrociato da 700 ms fra **due layer sovrapposti**.

### Meccanismo

Lo stato è: `front` (quale dei due layer, `0` o `1`, è visibile), `layerImages` (l'immagine montata in ciascun layer), `currentIdx`, `pending` (indice in arrivo, `null` quando fermo) e `fading`.

```
┌────────────────────────┐   timeout 4s   ┌─────────────────────────────────┐
│ idle: pending === null │ ──────────────▶│ layer back = slide N+1          │
└────────────────────────┘                │ setPending(N+1), opacity 0      │
                                          └───────────────┬─────────────────┘
                                                          │ await img.decode()
                                                          ▼
                                          ┌─────────────────────────────────┐
                                          │ setFading(true)                 │
                                          │ → opacity 0→1, CSS 700ms        │
                                          └───────────────┬─────────────────┘
                                                          │ setTimeout(700 + 50)
                                                          ▼
                                          ┌─────────────────────────────────┐
                                          │ front = back, currentIdx = N+1  │
                                          │ pending = null, fading = false  │
                                          └─────────────────────────────────┘
```

Due dettagli che sembrano ridondanti ma non lo sono:

- **`await img.decode()` prima di avviare il fade.** Se l'immagine di destinazione non è ancora decodificata, il crossfade parte su un layer vuoto e si vede un lampo. Aspettare il decode sposta il costo prima dell'animazione. Un decode fallito non blocca: il `catch` prosegue comunque.
- **La transizione è applicata solo al layer *back*, e solo mentre `pending !== null`.** Così il layer che torna a `opacity: 0` durante il settle non anima all'indietro.

Tutte le slide vengono pre-caricate al mount (`new window.Image()`) perché le successive non arrivino a metà fade.

### Pausa e reduced motion

Il ciclo automatico gira solo se `carouselImages.length > 1 && !paused && !reducedMotion`:

- **Pulsante di pausa** in basso a destra sullo slot A (`aria-pressed`, etichette `Home.photographyPauseCarousel` / `photographyPlayCarousel`). Richiesto da WCAG 2.2.2: un contenuto che si aggiorna da solo per più di 5 secondi deve poter essere fermato.
- **`prefers-reduced-motion: reduce`** ferma l'avanzamento del tutto. Disattivare solo il fade non basterebbe: l'immagine cambierebbe di scatto ogni 4 secondi, che è più fastidioso dell'animazione. La preferenza è letta con `useSyncExternalStore`, così non serve un `setState` dentro un effetto.

---

## Slot B e C — fallback automatico

Con una sola galleria nel manifest (solo la featured), `getSideGalleries(2)` restituisce array vuoto. `page.js` riempie i due slot con immagini del carosello della featured:

```js
while (filledSideGalleries.length < 2) {
  const fallbackIdx = filledSideGalleries.length + 1;
  const fallbackSrc = carouselImages[fallbackIdx % carouselImages.length]?.src ?? null;
  filledSideGalleries.push({ src: fallbackSrc, alt: galleryTitle, href: detailHref });
}
```

Appena si aggiungono altre gallerie al manifest i slot B/C mostrano automaticamente la loro cover Cloudinary.

---

## Aggiungere/modificare la galleria in evidenza

### Cambiare galleria featured

1. Nel manifest, sposta `featured: true` sulla galleria desiderata (o aggiungila a una nuova).
2. Imposta `homeImageAspect` sul rapporto corretto per le immagini di quella galleria.
3. Imposta `homeImageCount` (default `4`) oppure specifica `homeImages` per scegliere foto precise.
4. Deploy (le route sono statiche) o riavvia il dev server.

### Scegliere le immagini del carosello

**Automatico (consigliato per iniziare):** ometti `homeImages`, imposta solo `homeImageCount`. Vengono usate le prime N slide ordinate per `public_id`.

**Manuale:** aggiungi `homeImages` con i `public_id` esatti da Cloudinary. I `public_id` si trovano nel pannello Media Library di Cloudinary o ispezionando l'URL delle immagini in `/photography/[slug]`.

### Cambiare proporzione

Modifica solo `homeImageAspect` nella voce del manifest. Non serve aggiornare alcun componente: il crop Cloudinary e la proporzione del contenitore si derivano entrambi da questo campo.

---

## Checklist

| Obiettivo | Operazione |
|-----------|------------|
| Nuova galleria featured | `featured: true`, `homeImageAspect`, `homeImageCount` → deploy |
| Immagini specifiche nel carosello | `homeImages: [public_id, …]` → deploy |
| Cambiare proporzione slot A | `homeImageAspect: "4/3"` (o `"2/3"`, `"4/5"`) → deploy |
| Aggiungere galleria per slot B/C | Nuova voce senza `featured: true` → deploy |
| Foto nuove nel carosello (stessa cartella) | Upload su Cloudinary → [rigenera cache](./revalidazione-cache-photography.md) |
