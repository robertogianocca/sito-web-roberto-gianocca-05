# Sezione Photography in homepage

La sezione Photography nella homepage mostra un **mosaico asimmetrico** con carosello automatico, due slot laterali statici e una riga di thumbnail delle gallerie più recenti.

Documentazione correlata:

- [Gallerie Photography su Cloudinary](./cloudinary-photography.md)
- [Rivalidazione cache Photography](./revalidazione-cache-photography.md)

---

## Layout visivo

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
| Preparazione dati server (fetch Cloudinary, crop, fill slot) | [`src/app/[locale]/page.js`](../src/app/%5Blocale%5D/page.js) |
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

Le immagini del carosello usano `object-cover` nel componente: riempiono il contenitore senza bande nere, con crop centrato.

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

Il carosello in `HomePhotographyMosaic.client.js` cicla le immagini ogni **4 secondi** con un fade incrociato fluido da 700 ms.

### Meccanismo

```
┌──────────────┐     setInterval 4s      ┌──────────────────────────────┐
│ currentIdx=N │  ─── setNextIdx(N+1) ──▶│ nextIdx=N+1, opacity:0 in DOM│
└──────────────┘                          └──────────┬─────────────────┘
                                                     │ double rAF
                                                     ▼
                                          ┌──────────────────────────────┐
                                          │ setTransitioning(true)       │
                                          │ → opacity 0→1, CSS 700ms     │
                                          └──────────┬─────────────────┘
                                                     │ onTransitionEnd
                                                     ▼
                                          ┌──────────────────────────────┐
                                          │ setCurrentIdx(N+1)           │
                                          │ nextIdx=null, transitioning=F│
                                          └──────────────────────────────┘
```

**Perché il doppio `requestAnimationFrame`?**

In React 18 gli aggiornamenti di stato dentro `setInterval` sono **batched**: se `setNextIdx` e `setTransitioning(true)` fossero chiamati insieme, il componente riceverebbe un solo re-render con l'immagine già a `opacity:1`. La transizione CSS non partirebbe, `onTransitionEnd` non scatterebbe e `currentIdx` non avanzerebbe mai — risultato: un unico cambio non animato e poi blocco.

La soluzione separa i due aggiornamenti in render distinti:

1. `setNextIdx(next)` → l'immagine successiva entra nel DOM a `opacity:0`.
2. Dopo due frame (`requestAnimationFrame × 2`) → `setTransitioning(true)` → il browser può ora interpolare da `0` a `1`, la transizione CSS gira, `onTransitionEnd` viene invocato.

```js
// In HomePhotographyMosaic.client.js
useEffect(() => {
  if (nextIdx === null) return;
  const id = requestAnimationFrame(() => {
    requestAnimationFrame(() => setTransitioning(true));
  });
  return () => cancelAnimationFrame(id);
}, [nextIdx]);
```

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
