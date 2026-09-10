# VidStack Player (VimeoPlayer)

Video player personalizzato basato su [VidStack React](https://www.vidstack.io/) con provider Vimeo.

## File coinvolti

```
src/
  components/
    video/
      VimeoPlayer.js        ← componente player (unico file da modificare)
next.config.mjs             ← CSP aggiornata per Vimeo (img-src, connect-src)
```

## Pacchetti installati

```
@vidstack/react@1.15.4
media-icons                 richiesto internamente da @vidstack/react/icons
```

## Architettura del componente

```
VimeoPlayer({ vimeoId, title, className? })
└── <MediaPlayer viewType="video" src="vimeo/{id}">   ← no rounded corners
      ├── <MediaProvider />          ← iframe Vimeo gestito da VidStack
      └── <PlayerUI />               ← inner component (useMediaState vive qui)
            ├── <Gesture click>      ← click ovunque → play/pause
            ├── <Gesture pointerup>  ← movimento mouse → mostra controlli
            ├── flash overlay        ← React state, feedback visivo sul click
            └── <Controls.Root>          ← flex column, justify-end (barra in basso)
                  ├── gradient scrim
                  └── un solo chrome:
                        <MobileControls />   ← < md  (chrome bianco)
                        <DesktopControls />  ← ≥ md  (layout/style progetto 04)

Su desktop e mobile viene montato **un solo** `Controls.Group` (via `matchMedia`),
perché le utility Tailwind `hidden`/`md:block` perdevano contro
`display: inline-block` di `.vds-controls-group` e mostravano entrambi i set.
```

`PlayerUI` deve essere un componente figlio di `MediaPlayer` perché
`useMediaState` legge il contesto del player — non funziona fuori da `MediaPlayer`.

### Chrome mobile (`< md`)

Layout invariato rispetto alla versione precedente:

```
[Play] [Mute]                    [0:12 / 3:45] [FS]
████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

Colori bianchi via `PLAYER_STYLE` sul `MediaPlayer`.

### Chrome desktop (`md+`) — da sito-web-roberto-gianocca-04

```
[Play●] [FS] [Mute][Vol────]              0:12 / 3:45
████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

- Play circolare verde (`#00C934`) con icona nera
- Icone / time / slider verdi (`#00C934` / `#009226` / `#005B18`)
- Seek bar più alta (~7px)
- Token verdi **scoped** su `DesktopControls` (`DESKTOP_CONTROLS_STYLE`) così il mobile resta bianco
- Nessun `TimeSlider.Preview` (bug React 19)

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
// Corretto (senza Preview — vedi workaround React 19 sotto)
<TimeSlider.Root>
  <TimeSlider.Track className="vds-slider-track" />
  <TimeSlider.TrackFill className="vds-slider-track-fill vds-slider-track" />
  <TimeSlider.Progress className="vds-slider-progress vds-slider-track" />
  <TimeSlider.Thumb className="vds-slider-thumb" />
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
"connect-src 'self' https://vimeo.com"
```

- `i.vimeocdn.com` — thumbnail/poster dei video
- `vimeo.com` — API oEmbed per metadati (titolo, durata, ecc.)

## Workaround React 19: niente `TimeSlider.Preview`

Con `@vidstack/react` 1.14+ e React 19, `TimeSlider.Preview` può lasciare un `requestAnimationFrame` attivo dopo l’unmount del player. Al teardown compare `disabled is not a function`, seguito da `provider destroyed` (effetto collaterale).

Bug upstream: [vidstack/player#1851](https://github.com/vidstack/player/issues/1851).

**Scelta nel progetto:** non usare `TimeSlider.Preview` / `TimeSlider.Value` sulla timeline. Seeking, thumb e orario corrente/durata restano disponibili; manca solo il tooltip al passaggio del mouse sulla barra.

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
