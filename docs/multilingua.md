# Multilingua (i18n)

Il sito supporta italiano e inglese tramite [`next-intl`](https://next-intl.dev/). Le URL includono il prefisso di locale (`/it/...`, `/en/...`); la root `/` rileva automaticamente la lingua del browser (fallback: inglese).

## File coinvolti

```
src/
  proxy.js                              ← rilevamento locale e redirect (Next.js 16)
  i18n/
    routing.js                          ← definizione locales e defaultLocale
    request.js                          ← caricamento messaggi server-side
    navigation.js                       ← Link/useRouter/usePathname locale-aware
  messages/
    en.json                             ← stringhe UI in inglese
    it.json                             ← stringhe UI in italiano
  app/
    layout.js                           ← root layout (legge locale per lang="...")
    [locale]/
      layout.js                         ← NextIntlClientProvider + generateStaticParams
      page.js, photography/, video/, blog/, contact/
  content/
    blog/
      it/                               ← post del blog in italiano
      en/                               ← post del blog in inglese
  data/
    photography-galleries.js            ← title/shortDescription: { it, en }
    videos.js                           ← title/shortDescription: { it, en }
  lib/
    blog.js                             ← getAllPosts(locale), getPostBySlug(locale, slug)
    metadata.js                         ← buildAlternates() per hreflang SEO
  components/
    home/
      LanguageSwitcher.client.js        ← selettore IT/EN nella home
```

## Routing

| URL visitato | Comportamento |
|---|---|
| `/` | Il proxy rileva la lingua del browser e reindirizza a `/en` o `/it` |
| `/en`, `/it` | Home page nella lingua scelta |
| `/en/photography`, `/it/blog/post` | Pagine nelle rispettive lingue |
| Locale non valido | `notFound()` — 404 |

La configurazione è in `src/i18n/routing.js`:

```js
export const routing = defineRouting({
  locales: ["en", "it"],
  defaultLocale: "en",
});
```

## Aggiungere o modificare una stringa UI

1. Apri `src/messages/en.json` e aggiungi la chiave nel namespace appropriato.
2. Aggiungi la stessa chiave in `src/messages/it.json` con la traduzione italiana.
3. Nel componente usa `useTranslations("Namespace")` (client) o `getTranslations("Namespace")` (server):

```js
// Server component
const t = await getTranslations("Home");
return <h1>{t("contactTitle")}</h1>;

// Client component
const t = useTranslations("ContactForm");
return <button>{t("submit")}</button>;
```

I namespace attualmente definiti: `Metadata`, `Home`, `Nav`, `TagFilter`, `ContactForm`, `Photography`, `Video`, `Blog`, `RevalidateCache`.

## Aggiungere un post del blog

I post sono separati per locale nelle cartelle `src/content/blog/it/` e `src/content/blog/en/`. Il nome del file diventa lo slug dell'URL.

**Esempio** — per pubblicare il post `/it/blog/il-mio-post` e `/en/blog/il-mio-post`:

1. Crea `src/content/blog/it/il-mio-post.md` con frontmatter e testo in italiano.
2. Crea `src/content/blog/en/il-mio-post.md` con frontmatter e testo in inglese.
3. Fai commit e deploy.

Se un post esiste solo in una lingua e viene richiesto nell'altra, la pagina restituisce 404 (comportamento di `dynamicParams = false`). È quindi consigliato creare sempre entrambe le versioni.

Il frontmatter è identico per entrambe le versioni (vedi `docs/blog.md`); cambia solo il contenuto.

## Contenuti bilingui: fotografia e video

I dati di fotografia e video in `src/data/photography-galleries.js` e `src/data/videos.js` supportano `title` e `shortDescription` come oggetti `{ it, en }`:

```js
{
  slug: "nome-galleria",
  title: {
    it: "Titolo in italiano",
    en: "English title",
  },
  shortDescription: {
    it: "Descrizione in italiano.",
    en: "Description in English.",
  },
  folder: "...",
}
```

I componenti di pagina leggono il campo corretto in base al locale corrente. È ancora possibile usare una stringa semplice (una sola lingua) se non serve la traduzione.

## Selettore lingua

Il componente `LanguageSwitcher` in `src/components/home/LanguageSwitcher.client.js` è posizionato nella sezione intro della home, sotto la navigazione. Mostra due pill `IT` / `EN`: quello attivo ha sfondo scuro, quello inattivo è cliccabile.

Al clic usa `router.replace(pathname, { locale })` di next-intl: mantiene la pagina corrente e sostituisce solo il locale nell'URL (nessun reload completo).

## SEO: hreflang

Ogni pagina esporta `alternates.languages` tramite il helper `buildAlternates(path, routing)` in `src/lib/metadata.js`. Questo produce tag `<link rel="alternate" hreflang="...">` nel `<head>` per indicare ai motori di ricerca le versioni equivalenti nelle altre lingue.

```js
// Esempio in una pagina
export async function generateMetadata({ params }) {
  return {
    title: "...",
    alternates: buildAlternates("/photography", routing),
  };
}
```

## Aggiungere una nuova lingua

1. Aggiungi il codice locale all'array `locales` in `src/i18n/routing.js`.
2. Crea `src/messages/<locale>.json` con tutte le chiavi (prendendo `en.json` come modello).
3. Crea la cartella `src/content/blog/<locale>/` con i post tradotti.
4. Aggiungi le traduzioni nei dati `{ it, en, <locale> }` in `photography-galleries.js` e `videos.js`.
5. Il proxy e il `[locale]/layout.js` gestiscono automaticamente il nuovo locale.

## Dipendenza aggiunta

- [`next-intl`](https://next-intl.dev/) `4.13.0` — routing, traduzioni, middleware.
