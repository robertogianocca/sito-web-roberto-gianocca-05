# Video (Vimeo)

Elenco video in repo, player VidStack su Vimeo, pagina dettaglio con titolo, sottotitolo, crediti e layout a due colonne.

Per il player, vedi [VidStack Player](./vidstack-player.md). Per lo scroll orizzontale della listing (rotella, inerzia), vedi [Scroll orizzontale homepage](./homepage-horizontal-scroll.md).

---

## File coinvolti

```
src/
  data/
    videos.js                         ← manifest video (slug, testi, vimeoId, crediti)
  app/[locale]/
    video/
      page.js                         ← listing orizzontale con VideoCard
      [slug]/page.js                  ← dettaglio: colonna testi + player
  components/video/
    VideoCardRow.client.js            ← riga orizzontale con HorizontalScrollContainer
    VideoCard.js                      ← card in listing
    VimeoPlayer.js                    ← player VidStack (dettaglio)
    VideoCredits.js
    HomeFeaturedVideo.client.js
    HomeVideoThumb.js
```

---

## Aggiungere o modificare un video

Modifica [`src/data/videos.js`](../src/data/videos.js).

### Campi obbligatori

| Campo | Descrizione |
|-------|-------------|
| `slug` | URL: `/[locale]/video/{slug}` |
| `title` | Titolo del progetto (`string` o `{ it, en }`) |
| `subtitle` | Sottotitolo sotto il titolo nella pagina dettaglio; supporta markdown inline per corsivo (`*testo*`) |
| `vimeoId` | Id numerico Vimeo (solo cifre) |

### Campi opzionali

| Campo | Descrizione |
|-------|-------------|
| `credits` | Array di `{ role, names }` — `role` localizzato, `names` testo piano |
| `thumbnailUrl` | URL HTTPS per anteprima card |
| `tags` | Array di stringhe per filtrare nella listing (`?tag=…`) |
| `featured` | `true` per il video in evidenza in homepage |

---

## Pagine

### Listing (`/video`)

- Riga orizzontale di `VideoCard` con scroll fluido (stesso comportamento rotella della homepage su desktop).
- Filtro per tag opzionale (`TagFilter`).
- Click su una card → `/video/[slug]`.

### Dettaglio (`/video/[slug]`)

Layout desktop (`lg+`): testi a sinistra (`28rem`), player a destra (`flex-1`). Mobile: stack verticale.

---

## Localizzazione

- `title`, `subtitle` e `role` nei crediti supportano `{ it, en }` o stringa singola.
- Label UI in `src/messages/it.json` e `en.json` sotto il namespace `Video`.

---

## SEO

`generateMetadata` sulla pagina dettaglio usa `plainTextFromMarkdown(subtitle)` come meta description.
