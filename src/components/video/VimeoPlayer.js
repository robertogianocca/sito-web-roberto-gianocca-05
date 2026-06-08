'use client';

// VidStack foundational CSS — layout, slider mechanics, controls visibility,
// button sizing, time display. Colours are overridden via CSS custom properties.
import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/default/sliders.css';
import '@vidstack/react/player/styles/default/controls.css';
import '@vidstack/react/player/styles/default/buttons.css';
import '@vidstack/react/player/styles/default/time.css';

import { useEffect, useRef, useState } from 'react';
import {
  Controls,
  FullscreenButton,
  Gesture,
  MediaPlayer,
  MediaProvider,
  MuteButton,
  PlayButton,
  Time,
  TimeSlider,
  VolumeSlider,
  useMediaState,
} from '@vidstack/react';
import {
  FullscreenExitIcon,
  FullscreenIcon,
  MuteIcon,
  PauseIcon,
  PlayIcon,
  VolumeHighIcon,
  VolumeLowIcon,
} from '@vidstack/react/icons';

// ─── Colour tokens ────────────────────────────────────────────────────────────
// Applied as CSS custom properties on MediaPlayer so they cascade to every
// VidStack child. Overrides VidStack's built-in defaults.
const PLAYER_STYLE = {
  '--media-slider-track-fill-bg':     'white',
  '--media-slider-track-bg':          'rgb(255 255 255 / 0.25)',
  '--media-slider-track-progress-bg': 'rgb(255 255 255 / 0.45)',
  '--media-slider-thumb-bg':          'white',
  '--media-slider-thumb-border':      'none',
  '--media-button-color':             'rgba(255,255,255,0.9)',
  '--media-time-color':               'rgba(255,255,255,0.9)',
  '--media-time-divider-color':       'rgba(255,255,255,0.45)',
  '--media-time-font-size':           '12px',
  // Fade in/out speed — matches project 04's 2 s ease-out.
  // The visibility delay on out keeps controls interactive during the fade.
  '--media-controls-in-transition':  'opacity 2s ease-out, visibility 0s',
  '--media-controls-out-transition': 'opacity 2s ease-out, visibility 0s linear 2s',
};

// Timeline slider hit-area / track height overrides (applied per-slider).
const TIMELINE_STYLE = {
  '--media-slider-track-height':         '3px',
  '--media-slider-focused-track-height': '5px',
  '--media-slider-thumb-size':           '13px',
};

// ─── PlayerUI ─────────────────────────────────────────────────────────────────
// Inner component — must live inside <MediaPlayer> to call useMediaState.
function PlayerUI() {
  const paused     = useMediaState('paused');
  const muted      = useMediaState('muted');
  const volume     = useMediaState('volume');
  const fullscreen = useMediaState('fullscreen');

  // Dark flash on every play/pause toggle — visual feedback for click-anywhere.
  const [flash, setFlash] = useState(false);
  const prevPaused = useRef(paused);
  useEffect(() => {
    if (prevPaused.current === paused) return;
    prevPaused.current = paused;
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 220);
    return () => clearTimeout(id);
  }, [paused]);

  return (
    <>
      {/* ── Click anywhere → toggle play/pause ──────────────────────────────
          Uses "click" (not "pointerup") so it doesn't conflict with the
          "pointerup" controls-visibility gesture below.                      */}
      <Gesture
        className="absolute inset-0"
        event="click"
        action="toggle:paused"
      />

      {/* ── Pointer activity → show/hide controls ───────────────────────────
          vds-gesture class lets VidStack register the gesture internally.    */}
      <Gesture
        className="vds-gesture"
        event="pointerup"
        action="toggle:controls"
      />

      {/* ── Flash overlay ───────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-200 ${
          flash ? 'opacity-20' : 'opacity-0'
        }`}
      />

      {/* ── Controls overlay ────────────────────────────────────────────────
          vds-controls  → position: absolute; inset: 0; flex-column.
                          opacity + visibility toggled by [data-visible].
          justify-end   → pushes content to the bottom edge.                 */}
      <Controls.Root className="vds-controls justify-end" hideDelay={3000}>

        {/* Gradient scrim — prevents controls blending into bright video frames */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black via-black/80 to-transparent"
        />

        {/* ── Buttons row ─────────────────────────────────────────────────── */}
        <Controls.Group className="vds-controls-group relative">
          <div className="flex flex-row items-center justify-between px-3">

            {/* Left side: Play → Mute → Volume slider */}
            <div className="flex flex-row items-center">

              <PlayButton
                className="vds-button"
                aria-label={paused ? 'Riproduci' : 'Pausa'}
              >
                {paused
                  ? <PlayIcon className="vds-icon" />
                  : <PauseIcon className="vds-icon" />
                }
              </PlayButton>

              <MuteButton
                className="vds-button"
                aria-label={muted ? 'Riattiva audio' : 'Silenzia'}
              >
                {(muted || volume === 0)
                  ? <MuteIcon className="vds-icon" />
                  : volume < 0.5
                    ? <VolumeLowIcon className="vds-icon" />
                    : <VolumeHighIcon className="vds-icon" />
                }
              </MuteButton>

              {/* Volume slider — hidden on mobile (too small to be usable) */}
              <div className="hidden md:flex items-center">
                <VolumeSlider.Root className="vds-slider" style={{ width: '72px' }}>
                  <VolumeSlider.Track className="vds-slider-track" />
                  <VolumeSlider.TrackFill className="vds-slider-track-fill vds-slider-track" />
                  {/* opacity-100 keeps thumb always visible (not just on hover) */}
                  <VolumeSlider.Thumb className="vds-slider-thumb opacity-100 border-0 w-3 h-3" />
                </VolumeSlider.Root>
              </div>

            </div>

            {/* Right side: Time display → Fullscreen */}
            <div className="flex flex-row items-center">

              <div className="vds-time-group">
                <Time className="vds-time" type="current" />
                <span className="vds-time-divider">/</span>
                <Time className="vds-time" type="duration" />
              </div>

              <FullscreenButton
                className="vds-button"
                aria-label={fullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
              >
                {fullscreen
                  ? <FullscreenExitIcon className="vds-icon" />
                  : <FullscreenIcon className="vds-icon" />
                }
              </FullscreenButton>

            </div>
          </div>

          {/* ── Timeline ──────────────────────────────────────────────────────
              Track, TrackFill, Progress, Thumb must be flat siblings — VidStack
              positions them as absolute layers on top of each other via CSS.
              Nesting any of them breaks the stacking.                        */}
          <TimeSlider.Root
            className="vds-time-slider vds-slider mx-0 h-4"
            style={TIMELINE_STYLE}
            pauseWhileDragging
          >
            <TimeSlider.Track className="vds-slider-track rounded-none" />
            <TimeSlider.TrackFill className="vds-slider-track-fill vds-slider-track rounded-none" />
            <TimeSlider.Progress className="vds-slider-progress vds-slider-track rounded-none" />
            <TimeSlider.Thumb className="vds-slider-thumb" />
            <TimeSlider.Preview className="vds-slider-preview">
              <TimeSlider.Value
                className="vds-slider-value"
                type="pointer"
                format="time"
              />
            </TimeSlider.Preview>
          </TimeSlider.Root>

        </Controls.Group>

      </Controls.Root>
    </>
  );
}

// ─── VimeoPlayer ──────────────────────────────────────────────────────────────

/**
 * @param {{ vimeoId: string; title: string }} props
 */
export function VimeoPlayer({ vimeoId, title }) {
  return (
    <div className="relative w-full max-w-5xl">
      {/*
        viewType="video"  → applies [data-view-type="video"] immediately so
                            controls.css transitions fire from the first render.
        aspectRatio       → explicit 16:9 sizing; VidStack uses it before the
                            Vimeo iframe reports its own dimensions.
        load="visible"    → lazy: iframe is created only when scrolled into view.
      */}
      <MediaPlayer
        viewType="video"
        aspectRatio="16/9"
        className="w-full overflow-hidden rounded-xl bg-black shadow-sm"
        title={title}
        src={`vimeo/${vimeoId}`}
        load="visible"
        playsInline
        style={PLAYER_STYLE}
      >
        <MediaProvider />
        <PlayerUI />
      </MediaPlayer>
    </div>
  );
}
