# Blog

Il blog è composto da file Markdown nella cartella `src/content/blog/`. Non serve un CMS esterno: ogni file è un post, e pubblicare significa fare commit + deploy.

## Struttura dei file

```
src/
  content/
    blog/
      nome-del-post.md      ← il nome del file diventa lo slug dell'URL
  lib/
    blog.js                 ← getAllPosts(), getPostBySlug(), getBlogStaticParams(), collectBlogTags()
  app/
    blog/
      page.js               ← /blog (lista post con filtro tag)
      [slug]/
        page.js             ← /blog/:slug (post singolo)
  components/
    blog/
      BlogCard.js           ← card per la griglia in listing e homepage
      BlogPostBody.js       ← rendering del corpo Markdown via react-markdown
```

## Frontmatter di ogni post

```md
---
title: "Titolo del post"
date: "2026-06-05"
excerpt: "Breve descrizione usata nella card e come meta description SEO."
tags: ["tag1", "tag2"]
coverImage: "https://res.cloudinary.com/..."   # opzionale
draft: false
---

Corpo del post in Markdown.
```

| Campo | Tipo | Obbligatorio | Note |
|---|---|---|---|
| `title` | stringa | sì | Titolo del post e della pagina |
| `date` | stringa ISO `YYYY-MM-DD` | sì | Usato per l'ordinamento (decrescente) |
| `excerpt` | stringa | sì | Usato nella card e come `<meta description>` |
| `tags` | array di stringhe | no | Abilita il filtro tag su `/blog` |
| `coverImage` | URL HTTPS | no | Immagine di copertina nella card e come `og:image`; usa Cloudinary (già in `remotePatterns`) |
| `draft` | booleano | no | Se `true`, il post è visibile solo in `development`; nascosto in produzione |

## Aggiungere un post

1. Crea un file `.md` in `src/content/blog/` con il nome che vuoi come slug (es. `mio-nuovo-post.md` → URL `/blog/mio-nuovo-post`).
2. Inserisci il frontmatter e il corpo Markdown.
3. Fai commit e deploy.

Per scrivere una bozza senza pubblicarla: imposta `draft: true`. Il post sarà visibile in locale (`npm run dev`) ma non in produzione.

## Come funziona il routing

Le pagine del blog usano SSG (Static Site Generation) con `generateStaticParams()`:

- `src/lib/blog.js` legge tutti i file `.md` con `fs.readFileSync` al momento della build (server-only).
- `gray-matter` ne estrae il frontmatter e il corpo.
- `getBlogStaticParams()` genera i parametri per `generateStaticParams()` in `src/app/blog/[slug]/page.js`.
- `dynamicParams = false`: qualsiasi slug non presente al momento della build restituisce 404.

## Homepage

La sezione Blog in homepage (`src/app/page.js`) mostra gli ultimi 2 post (`getAllPosts().slice(0, 2)`) come `BlogCard`. L'ordine nella barra orizzontale è: Photography → Video → Graphic design → **Blog** → Contatti.

## Dipendenza aggiunta

- [`gray-matter`](https://github.com/jonschlinkert/gray-matter) — parsing del frontmatter YAML. Nessun'altra dipendenza aggiunta.

## Estensioni future (non implementate)

- **RSS feed** — App Router route handler su `/blog/feed.xml`
- **Tempo di lettura** — stima basata sul conteggio delle parole
- **Navigazione prev/next** — link al post precedente e successivo in fondo al post
- **Ricerca full-text** — client-side su titoli ed excerpt
