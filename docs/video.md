# Video (Vimeo)

Elenco video in repo, player VidStack su Vimeo, pagina dettaglio con titolo, sottotitolo, crediti e layout a due colonne.

Per il player, vedi [VidStack Player](./vidstack-player.md).

---

## File coinvolti

```
src/
  data/
    videos.js                         ← manifest video (slug, testi, vimeoId, crediti)
  app/[locale]/
    video/
      page.js                         ← listing con card e filtro tag
      [slug]/page.js                  ← dettaglio: colonna testi + player
  components/video/
    VimeoPlayer.js                    ← player VidStack (dettaglio)
    VideoCredits.js                   ← elenco crediti localizzati
    VideoCard.js                      ← card in listing
    HomeFeaturedVideo.client.js       ← blocco featured in homepage
    HomeVideoThumb.js                 ← thumbnail in homepage
  lib/
    vimeo.js                          ← thumbnail oEmbed per homepage
    i18n-content.js                   ← resolveLocalized
    plain-text-from-markdown.js       ← testo piano per SEO e card
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
| `thumbnailUrl` | URL HTTPS per anteprima card; senza, la card mostra un segnaposto |
| `tags` | Array di stringhe per filtrare nella listing (`?tag=…`) |
| `featured` | `true` per il video in evidenza in homepage (solo il primo marcato viene usato) |

### Esempio

```js
{
  slug: "sugar-mama",
  title: "Sugar Mama",
  subtitle: {
    it: "Video musicale per *Matt Pascale & The Stomps*",
    en: "Music video for *Matt Pascale & The Stomps*",
  },
  credits: [
    {
      role: {
        it: "Regia, Montaggio, Post-produzione",
        en: "Direction, Editing, Post-production",
      },
      names: "Roberto Gianocca",
    },
    {
      role: { it: "Interpreti", en: "Performers" },
      names: "Matt Pascale, Sofia Buob, Shondel Bervini",
    },
  ],
  vimeoId: "1132948199",
  featured: true,
}
```

Il corsivo nel sottotitolo si ottiene con `*parte in corsivo*` (stessa convenzione markdown di Photography). In dettaglio viene renderizzato da `PhotographyRichDescription`; in listing e homepage il markdown viene rimosso con `plainTextFromMarkdown`.

---

## Pagine

### Listing (`/video`)

- Griglia di `VideoCard` con titolo e sottotitolo in testo piano.
- Filtro per tag opzionale (`TagFilter`).
- Dati da `VIDEOS` in `videos.js`.

### Dettaglio (`/video/[slug]`)

Layout desktop (`lg+`):

| Colonna sinistra (larghezza fissa `28rem`) | Colonna destra (`flex-1`) |
|--------------------------------------------|---------------------------|
| Back link, titolo, sottotitolo (markdown), crediti | Player Vimeo a tutta larghezza |

- Allineata al margine sinistro della pagina (`px-6` / `md:px-10`).
- Il player occupa tutto lo spazio rimanente a destra.

Mobile: stack verticale — testi sopra, player sotto.

### Homepage

Il blocco featured usa titolo e sottotitolo (testo piano) dal video con `featured: true`. I crediti compaiono solo nella pagina dettaglio.

---

## Localizzazione

- `title`, `subtitle` e `role` nei crediti supportano `{ it, en }` o stringa singola.
- `names` nei crediti resta una stringa (nomi propri non tradotti).
- Label UI (errori, filtri, CTA) in `src/messages/it.json` e `en.json` sotto il namespace `Video`.

---

## SEO

`generateMetadata` sulla pagina dettaglio usa `plainTextFromMarkdown(subtitle)` come meta description.
