# VidStack Player (VimeoPlayer)

Video player personalizzato basato su [VidStack React](https://www.vidstack.io/) con provider Vimeo.

## File coinvolti

```
src/
  components/
    video/
      VimeoPlayer.js        ← componente player (unico file da modificare)
next.config.mjs             ← CSP aggiornata per Vimeo (img-src, connect-src) e preview Cloudinary (media-src)
```

## Pacchetti installati

```
@vidstack/react@1.15.4
media-icons                 richiesto internamente da @vidstack/react/icons
```

## Architettura del componente

```
VimeoPlayer({ vimeoId, title, className?, poster?, preview?, idlePlayOnly? })
└── <MediaPlayer viewType="video" src="vimeo/{id}">   ← no rounded corners
      ├── <MediaProvider />          ← iframe Vimeo gestito da VidStack
      └── <PlayerUI />               ← inner component (useMediaState vive qui)
            ├── copertina next/image su fondo nero (z-1), fade-in su load, finché `playing`
            ├── idlePlayOnly && !started: IdlePlaySurface (homepage)
            ├── <Gesture click>      ← click ovunque → play/pause (dopo start / sul dettaglio)
            ├── <Gesture pointerup>  ← mostra/nascondi controlli (solo dopo start)
            ├── flash overlay        ← React state, feedback visivo sul click
            └── <Controls.Root>      ← dettaglio: visibile da subito, senza fade finché !started
                  ├── gradient scrim
                  └── un solo chrome:
                        <MobileControls />   ← < md  (chrome bianco)
                        <DesktopControls />  ← ≥ md  (cerchi + volume hover)
            └── <PreviewIntro />     ← z-5, stage nero SSR (CSS lg+), solo con `preview` (vedi sotto)

Su desktop e mobile viene montato **un solo** `Controls.Group` (via `matchMedia`),
perché le utility Tailwind `hidden`/`md:block` perdevano contro
`display: inline-block` di `.vds-controls-group` e mostravano entrambi i set.
```

`PlayerUI` deve essere un componente figlio di `MediaPlayer` perché
`useMediaState` legge il contesto del player — non funziona fuori da `MediaPlayer`.

### Copertina e preview intro

Ogni video parte sempre allo stesso modo:

- desktop con `preview`: primo frame della preview (taglio netto, nessun fade) → preview → lo stage sfuma e rivela copertina + player insieme;
- mobile / reduced motion / senza preview: copertina subito se in cache; fade-in solo se il caricamento supera ~100ms.

Nel cambio video dai thumbnail non ci sono fade-out/fade-in: il nuovo player compare già con il primo frame (o la copertina).

Dettagli:

- **Copertina:** `next/image` (`fill`, `loading="eager"`, `fetchPriority="high"`) renderizzata da SSR dentro un wrapper `bg-black` (z-1), che copre anche il thumbnail dell'iframe Vimeo. Componente `PlayerCover`: se l'immagine è in cache compare subito (nessuna transizione); se dopo 100ms (`COVER_INSTANT_MS`) non è ancora caricata viene nascosta e fa fade-in (300ms) su `onLoad`, così non "salta" dentro dopo un attimo di nero. Resta finché lo stato `playing` non diventa vero.
  - Non si usa il `<Poster>` di VidStack: parte da opacity 0, fa fade-in e si ricalcola a ogni cambio sorgente (era la causa del blink tra un video e l'altro).
  - Anche se Vimeo ha già una copertina corretta, quella arriva tardi (dopo idratazione + oEmbed).
- **Preview (`PreviewIntro`, da progetto 04):** uno stage nero opaco (z-5) sopra copertina, gesture e controlli.
  - Lo stage è mostrato via CSS (`hidden motion-safe:lg:block`, stessa condizione di `PREVIEW_MQ`), quindi è renderizzato da SSR: anche su hard reload il primo frame è nero, mai la copertina prima dell'animazione. I controlli (che al mount VidStack mostra, nasconde e rimostra quando Vimeo è pronto) restano nascosti durante l'intro.
  - Solo il `<video>` aspetta il check client (`useMediaQuery(PREVIEW_MQ)`), così su mobile l'MP4 non viene scaricato.
  - Lo sfondo dello stage è il primo frame della preview, generato da Cloudinary sullo stesso asset (`/video/upload/so_0/…/nome.jpg`, 14–41 KB): il video parte sopra la stessa immagine, quindi senza fade né salto. Su mobile lo stage è `display: none` e lo sfondo non viene scaricato.
  - Lo stage sfuma (900ms) e si smonta su: `ended`; click (che chiama anche `remote.play()` — in 04 l'overlay era `pointer-events-none` e il click finiva sul player nascosto); `error` o autoplay bloccato; player partito in altro modo; oppure se la preview non è partita entro 3s (rete lenta), così la pagina non resta mai nera.
- **Cambio video:** la pagina dettaglio passa `key={vimeoId}`. I controlli restano visibili da subito (classe `player-controls-ready`, niente auto-hide né transizione) finché il video non è partito, così non c'è un frame vuoto in attesa di `[data-visible]`. Dopo il play: `hideDelay={3000}` e `hideOnMouseLeave`.

### Chrome mobile (`< md`)

Layout invariato rispetto alla versione precedente:

```
[Play] [Mute]                    [0:12 / 3:45] [FS]
████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

Colori bianchi via `PLAYER_STYLE` sul `MediaPlayer`.

### Chrome desktop (`md+`) — da sito-web-roberto-gianocca-04

```
[Play●] [FS○] [Mute○][~Vol────]              0:12 / 3:45
████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

- Play: cerchio pieno verde (`#00C934`) con icona nera — unico controllo primario
- Fullscreen e Mute: cerchi secondari permanenti (bordo verde soft + fondo scuro translucido), stessi 35px; al hover/focus si riempiono di verde con icona nera
- Volume: nascosto di default; si apre a destra del Mute su hover/focus; dopo aver regolato il volume si richiude ~1.1s dopo (anche se il cursore è ancora sopra); per riaprirlo bisogna uscire e rientrare. Su leave senza drag: stessa delay. Su touch resta sempre visibile
- Hover secondari: solo fade colore (verde pieno + icona nera), **senza** scale/ingrandimento
- Spaziatura uniforme `gap-1.5` (6px) tra Play / FS / gruppo volume
- Icone / time / slider verdi (`#00C934` / `#009226` / `#005B18`)
- Seek bar flush al bordo inferiore (**7px** track + thumb **12px** ancorato in basso via `.desktop-seek-bar .vds-slider-thumb`, così cresce verso l’alto e non viene tagliato da `overflow-hidden`)
- Token verdi **scoped** su `DesktopControls` (`DESKTOP_CONTROLS_STYLE`) così il mobile resta bianco
- Timestamp hover/drag: componente custom `SeekTimePreview` (non `TimeSlider.Preview` — bug React 19)

Stili secondari / volume / preview in `globals.css`: `.desktop-secondary-circle`, `.desktop-volume-group`, `.desktop-volume-rail`, `.seek-time-preview`.

## CSS: approccio ibrido

VidStack fornisce CSS fondamentale che gestisce i comportamenti interni:

| File importato | Cosa fornisce |
|---|---|
| `base.css` | layout player/iframe, cursor auto-hide quando i controlli sono nascosti |
| `default/sliders.css` | posizionamento thumb (`left: var(--slider-fill)`), visibile su `data-active` |
| `default/controls.css` | `vds-controls` absolute, opacity+visibility su `data-visible` |
| `default/buttons.css` | dimensioni e flex centering dei `vds-button` |
| `default/time.css` | layout `vds-time-group` |

I colori e le transizioni base sono sovrascritti tramite **CSS custom properties** su `<MediaPlayer>`.
Il desktop applica un secondo set di variabili sul proprio `Controls.Group`.

### Proprietà principali

```js
// Colori slider
'--media-slider-track-fill-bg'      // barra tempo riprodotto
'--media-slider-track-bg'           // sfondo barra
'--media-slider-track-progress-bg'  // buffering
'--media-slider-thumb-bg'           // pallino thumb

// Colori UI
'--media-button-color'              // colore icone bottoni
'--media-time-color'                // colore testo orario
'--media-time-divider-color'        // colore separatore "/"

// Transizioni controlli
'--media-controls-in-transition'    // animazione comparsa
'--media-controls-out-transition'   // animazione sparizione (include delay su visibility
                                    // per mantenere i controlli cliccabili durante il fade)

// Dimensioni slider (applicate per-slider via style inline)
'--media-slider-track-height'
'--media-slider-focused-track-height'
'--media-slider-thumb-size'
```

## Struttura TimeSlider — attenzione

`Track`, `TrackFill`, `Progress`, `Thumb` devono essere **figli diretti (flat siblings)**
di `TimeSlider.Root`. VidStack li posiziona con `position: absolute` uno sopra l'altro.
Nidificare `TrackFill` o `Progress` dentro `Track` rompe lo stacking.

```jsx
// Corretto (senza TimeSlider.Preview — vedi workaround React 19 sotto)
<TimeSlider.Root>
  <TimeSlider.Track className="vds-slider-track" />
  <TimeSlider.TrackFill className="vds-slider-track-fill vds-slider-track" />
  <TimeSlider.Progress className="vds-slider-progress vds-slider-track" />
  <TimeSlider.Thumb className="vds-slider-thumb" />
  <SeekTimePreview /> {/* custom; non è una parte VidStack */}
</TimeSlider.Root>

// SBAGLIATO — non fare così
<TimeSlider.Track>
  <TimeSlider.TrackFill />   {/* rotto */}
  <TimeSlider.Progress />    {/* rotto */}
</TimeSlider.Track>
```

## Gestures — perché due eventi diversi

```jsx
<Gesture event="click"     action="toggle:paused"   />   // play/pause
<Gesture event="pointerup" action="toggle:controls"  />   // mostra/nascondi UI
```

Usare `pointerup` per entrambi causa un double-fire sullo stesso elemento.
`click` per il play/pause è la separazione corretta (stessa scelta del vecchio progetto 04).

## CSP (next.config.mjs)

```js
"img-src 'self' data: blob: https://i.vimeocdn.com"
"media-src 'self' https://res.cloudinary.com"
"connect-src 'self' https://vimeo.com"
```

- `i.vimeocdn.com` — thumbnail/poster dei video
- `res.cloudinary.com` (media) — MP4 della preview intro; senza, `default-src 'self'` la blocca
- `vimeo.com` — API oEmbed per metadati (titolo, durata, ecc.)

## Workaround React 19: niente `TimeSlider.Preview`

Con `@vidstack/react` 1.14+ e React 19, `TimeSlider.Preview` può lasciare un `requestAnimationFrame` attivo dopo l’unmount del player. Al teardown compare `disabled is not a function`, seguito da `provider destroyed` (effetto collaterale).

Bug upstream: [vidstack/player#1851](https://github.com/vidstack/player/issues/1851).

**Scelta nel progetto:** non usare `TimeSlider.Preview` / `TimeSlider.Value`. Al loro posto, `SeekTimePreview` dentro ogni `TimeSlider.Root` legge `useSliderState('pointerValue' | 'pointerPercent' | 'pointing' | 'dragging')`, formatta con `formatTime`, e clamp-a `left` ai bordi (6%–94%). Stili in `.seek-time-preview` (desktop verde/nero, mobile bianco/nero). Visibile su hover/drag desktop e touch/drag mobile.

### Geometria thumb desktop

Il player ha `overflow-hidden`. Con track flush da 7px e thumb 12px centrato, il thumb veniva tagliato in basso (~2.5px). Soluzione: tenere `--media-slider-height: 7px` (barra a filo col fondo) e in `.desktop-seek-bar` ancorare il thumb con `bottom: 0` + `translateX(-50%)` così cresce verso l’alto dentro il frame.

## Errori di console attesi (non critici)

| Messaggio | Causa | Impatto |
|---|---|---|
| `Setting the playback rate is not enabled for this video` | Vimeo basic plan non permette `setPlaybackRate()`. VidStack la chiama sempre. | Nessuno — la riproduzione funziona normalmente |
| `TypeError: this.$state[prop] is not a function` | Bug del logger di Next.js 16 Turbopack in dev mode: tenta di serializzare il Proxy reattivo di VidStack quando VidStack logga l'errore di orientation lock (fullscreen su mobile). | Solo dev mode — il fullscreen funziona correttamente |

## Come cambiare i colori

- **Mobile / base:** costanti `PLAYER_STYLE` in `VimeoPlayer.js`
- **Desktop:** `DESKTOP_COLOR` + `DESKTOP_CONTROLS_STYLE` (non toccare il mobile)

## Come cambiare la velocità di fade dei controlli

```js
'--media-controls-in-transition':  'opacity Xs ease-out, visibility 0s',
'--media-controls-out-transition': 'opacity Xs ease-out, visibility 0s linear Xs',
```

Il secondo `Xs` nel `linear Xs` del out-transition deve corrispondere alla durata
dell'opacity per mantenere i controlli cliccabili durante tutto il fade.
