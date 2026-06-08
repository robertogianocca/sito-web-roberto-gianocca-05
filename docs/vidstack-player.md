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
@vidstack/react@next        versione 1.x (API "next" — non "latest" che è 0.6.x)
media-icons@next            richiesto internamente da @vidstack/react/icons
```

Installati con `--legacy-peer-deps` perché `@vidstack/react` dichiara `react@^18`
ma il progetto usa React 19.

## Architettura del componente

```
VimeoPlayer({ vimeoId, title })
└── <MediaPlayer viewType="video" src="vimeo/{id}">
      ├── <MediaProvider />          ← iframe Vimeo gestito da VidStack
      └── <PlayerUI />               ← inner component (useMediaState vive qui)
            ├── <Gesture click>      ← click ovunque → play/pause
            ├── <Gesture pointerup>  ← movimento mouse → mostra controlli
            ├── flash overlay        ← React state, feedback visivo sul click
            └── <Controls.Root>
                  ├── gradient scrim
                  └── <Controls.Group>
                        ├── buttons row (Play · Mute · VolumeSlider | Time · Fullscreen)
                        └── <TimeSlider.Root>
```

`PlayerUI` deve essere un componente figlio di `MediaPlayer` perché
`useMediaState` legge il contesto del player — non funziona fuori da `MediaPlayer`.

## CSS: approccio ibrido

VidStack fornisce CSS fondamentale che gestisce i comportamenti interni:

| File importato | Cosa fornisce |
|---|---|
| `base.css` | layout player/iframe, cursor auto-hide quando i controlli sono nascosti |
| `default/sliders.css` | posizionamento thumb (`left: var(--slider-fill)`), visibile su `data-active` |
| `default/controls.css` | `vds-controls` absolute, opacity+visibility su `data-visible` |
| `default/buttons.css` | dimensioni e flex centering dei `vds-button` |
| `default/time.css` | layout `vds-time-group` |

I colori e le transizioni sono sovrascritti tramite **CSS custom properties** passate
come `style` su `<MediaPlayer>` — si propagano in cascade a tutti i figli.

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
// Corretto
<TimeSlider.Root>
  <TimeSlider.Track className="vds-slider-track" />
  <TimeSlider.TrackFill className="vds-slider-track-fill vds-slider-track" />
  <TimeSlider.Progress className="vds-slider-progress vds-slider-track" />
  <TimeSlider.Thumb className="vds-slider-thumb" />
  <TimeSlider.Preview className="vds-slider-preview">
    <TimeSlider.Value className="vds-slider-value" type="pointer" format="time" />
  </TimeSlider.Preview>
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

## Errori di console attesi (non critici)

| Messaggio | Causa | Impatto |
|---|---|---|
| `Setting the playback rate is not enabled for this video` | Vimeo basic plan non permette `setPlaybackRate()`. VidStack la chiama sempre. | Nessuno — la riproduzione funziona normalmente |
| `TypeError: this.$state[prop] is not a function` | Bug del logger di Next.js 16 Turbopack in dev mode: tenta di serializzare il Proxy reattivo di VidStack quando VidStack logga l'errore di orientation lock (fullscreen su mobile). | Solo dev mode — il fullscreen funziona correttamente |

## Come cambiare i colori del player

Modificare le costanti in `PLAYER_STYLE` all'inizio di `VimeoPlayer.js`.
Non serve CSS aggiuntivo — le custom properties si propagano automaticamente.

## Come cambiare la velocità di fade dei controlli

```js
'--media-controls-in-transition':  'opacity Xs ease-out, visibility 0s',
'--media-controls-out-transition': 'opacity Xs ease-out, visibility 0s linear Xs',
```

Il secondo `Xs` nel `linear Xs` del out-transition deve corrispondere alla durata
dell'opacity per mantenere i controlli cliccabili durante tutto il fade.
