# Testi di sezione homepage

Le **short description** mostrate accanto al titolo di ogni pannello orizzontale vivono in un unico file dati in repo — non in `messages/*.json` e non in un CMS.

Per il layout orizzontale generale, vedi [Scroll orizzontale homepage](./homepage-horizontal-scroll.md).

---

## Dove modificare i testi

| Cosa | File |
|------|------|
| Descrizione breve dell’**area** (Photography, Video, …) | [`src/data/home-sections.js`](../src/data/home-sections.js) |
| Descrizione del **progetto in evidenza** (mosaico / player) | [`src/data/videos.js`](../src/data/videos.js), [`src/data/photography-galleries.js`](../src/data/photography-galleries.js) |
| Label UI (CTA, aria-label, titolo Contatti) | [`src/messages/it.json`](../src/messages/it.json), [`src/messages/en.json`](../src/messages/en.json) |

Non duplicare: l’header parla dell’area del portfolio; il blocco sotto continua a usare la `shortDescription` del singolo video o galleria featured.

---

## Struttura dati

Ogni sezione in `HOME_SECTIONS` accetta:

- `shortDescription` — `{ it, en }` o stringa; mostrata nell’header di `HorizontalSection`
- `description` — riservato a copy più lungo (non ancora usato in UI)

```js
export const HOME_SECTIONS = {
  photography: {
    shortDescription: {
      it: "…",
      en: "…",
    },
  },
  // intro, video, graphicDesign, blog, contact
};
```

Helper: `getHomeSectionCopy(sectionId, locale)` → `{ shortDescription, description }`.

La risoluzione locale `{ it, en }` → stringa è in [`src/lib/i18n-content.js`](../src/lib/i18n-content.js) (`resolveLocalized`).

---

## Layout header

[`HorizontalSection`](../src/components/home/HorizontalSection.js) accetta la prop opzionale `shortDescription` (già localizzata, passata da [`page.js`](../src/app/[locale]/page.js)).

| Viewport | Comportamento |
|----------|----------------|
| **Mobile** | Titolo sopra, testo sotto (stack) |
| **Desktop (`lg+`)** | Flex row: titolo a sinistra (`shrink-0`), testo a destra con `gap-5`, larghezza limitata `max-w-prose` |

Se `shortDescription` è omessa, l’header resta solo titolo (comportamento precedente).

---

## ID sezione

| `sectionId` in `getHomeSectionCopy` | `id` DOM in homepage |
|-------------------------------------|----------------------|
| `intro` | `intro` |
| `photography` | `photography` |
| `video` | `video` |
| `graphicDesign` | `graphic-design` |
| `blog` | `blog` |
| `contact` | `contact` |

---

## Placeholder attuale

Tutte le sezioni usano temporaneamente `LOREM_TWO_LINES` (~due righe a `max-w-prose`) per valutare il layout. Sostituire con copy reale per ogni chiave in `HOME_SECTIONS` quando pronto.
