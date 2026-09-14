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
  lib/
    vimeo.js                          ← metadata oEmbed (thumbnail e durata)
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
| `thumbnailUrl` | URL HTTPS per anteprima card / filmstrip |
| `coverUrl` | URL HTTPS per poster player (dettaglio e featured); se assente si usa `thumbnailUrl` |
| `tags` | Array di stringhe per filtrare nella listing (`?tag=…`) |
| `featured` | `true` per il video in evidenza in homepage |

---

## Pagine

### Listing (`/video`)

- Su mobile le card sono impilate verticalmente: immagine arrotondata separata dal sottotitolo; il titolo resta nascosto.
- Da `md` le card mantengono il layout completo e la riga orizzontale con scroll fluido.
- La durata appare a destra del sottotitolo. Viene letta automaticamente da Vimeo oEmbed, formattata come `m:ss` o `h:mm:ss` e omessa se il servizio non restituisce un valore valido.
- La risposta oEmbed è memorizzata nella cache Next.js per 24 ore.
- Filtro per tag opzionale (`TagFilter`).
- Click su una card → `/video/[slug]`.

### Dettaglio (`/video/[slug]`)

Layout desktop (`lg+`): testi a sinistra (`28rem`), player a destra (`flex-1`). Mobile: stack verticale.

Filmstrip nel footer via parallel route `@footer/video/[slug]`. `SiteFooter` monta lo slot **solo** su `/video/[slug]`: la soft navigation di Next può tenere lo stato del parallel route dopo un click Home (o verso altre pagine), quindi senza questo gate i thumbnail resterebbero visibili.

---

## Localizzazione

- `title`, `subtitle` e `role` nei crediti supportano `{ it, en }` o stringa singola.
- Label UI in `src/messages/it.json` e `en.json` sotto il namespace `Video`.

---

## SEO

`generateMetadata` sulla pagina dettaglio usa `plainTextFromMarkdown(subtitle)` come meta description e `coverUrl` (o `thumbnailUrl`) come immagine Open Graph.
