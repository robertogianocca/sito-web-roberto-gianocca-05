'use client';

// VidStack foundational CSS — layout, slider mechanics, controls visibility,
// button sizing, time display. Colours are overridden via CSS custom properties.
import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/default/sliders.css';
import '@vidstack/react/player/styles/default/controls.css';
import '@vidstack/react/player/styles/default/buttons.css';
import '@vidstack/react/player/styles/default/time.css';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
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

const DESKTOP_MQ = '(min-width: 768px)';

function subscribeDesktop(onChange) {
  const mql = window.matchMedia(DESKTOP_MQ);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_MQ).matches;
}

function getDesktopServerSnapshot() {
  return false;
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot,
  );
}

// ─── Shared colour tokens (mobile + base) ─────────────────────────────────────
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
  '--media-controls-in-transition':  'opacity 2s ease-out, visibility 0s',
  '--media-controls-out-transition': 'opacity 2s ease-out, visibility 0s linear 2s',
};

const MOBILE_TIMELINE_STYLE = {
  '--media-slider-track-height':         '3px',
  '--media-slider-focused-track-height': '5px',
  '--media-slider-thumb-size':           '13px',
  '--media-slider-track-border-radius':  '0',
};

/** Desktop palette from sito-web-roberto-gianocca-04. */
const DESKTOP_COLOR = {
  playBg: '#00C934',
  playFg: '#000000',
  accent: '#00C934',
  progress: '#009226',
  track: '#005B18',
};

const DESKTOP_CONTROLS_STYLE = {
  '--media-slider-track-fill-bg':     DESKTOP_COLOR.accent,
  '--media-slider-track-bg':          DESKTOP_COLOR.track,
  '--media-slider-track-progress-bg': DESKTOP_COLOR.progress,
  '--media-slider-thumb-bg':          DESKTOP_COLOR.accent,
  '--media-slider-thumb-border':      'none',
  '--media-button-color':             DESKTOP_COLOR.accent,
  '--media-time-color':               DESKTOP_COLOR.accent,
  '--media-time-divider-color':       'rgb(0 201 52 / 0.45)',
};

const DESKTOP_TIMELINE_STYLE = {
  // Collapse the default 48px slider hit-box so the seek sits flush on the
  // bottom edge of the video (same as project 04's `.time-slider { height: 7px }`).
  '--media-slider-height':               '7px',
  '--media-slider-track-height':         '7px',
  '--media-slider-focused-track-height': '7px',
  '--media-slider-thumb-size':           '12px',
  '--media-slider-track-border-radius':  '0',
  margin: 0,
  padding: 0,
  width: '100%',
};

const DESKTOP_VOLUME_STYLE = {
  '--media-slider-height':               '35px',
  '--media-slider-track-height':         '4px',
  '--media-slider-focused-track-height': '4px',
  '--media-slider-thumb-size':           '12px',
  width: '60px',
  margin: 0,
  padding: 0,
};

// ─── Mobile controls (previous white chrome) ──────────────────────────────────
function MobileControls() {
  const paused     = useMediaState('paused');
  const muted      = useMediaState('muted');
  const volume     = useMediaState('volume');
  const fullscreen = useMediaState('fullscreen');

  return (
    <Controls.Group className="vds-controls-group !flex w-full !flex-col">
      <div className="flex flex-row items-center justify-between px-3">
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
        </div>

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

      <TimeSlider.Root
        className="vds-time-slider vds-slider mx-0 h-4"
        style={MOBILE_TIMELINE_STYLE}
        pauseWhileDragging
      >
        <TimeSlider.Track className="vds-slider-track rounded-none!" />
        <TimeSlider.TrackFill className="vds-slider-track-fill vds-slider-track rounded-none!" />
        <TimeSlider.Progress className="vds-slider-progress vds-slider-track rounded-none!" />
        <TimeSlider.Thumb className="vds-slider-thumb" />
      </TimeSlider.Root>
    </Controls.Group>
  );
}

// ─── Desktop controls (project 04 layout + green style) ───────────────────────
function DesktopControls() {
  const paused     = useMediaState('paused');
  const muted      = useMediaState('muted');
  const volume     = useMediaState('volume');
  const fullscreen = useMediaState('fullscreen');

  return (
    <Controls.Group
      className="vds-controls-group absolute inset-x-0 bottom-0 !block w-full"
      style={DESKTOP_CONTROLS_STYLE}
    >
      {/* Same stack as project 04: buttons row, then a 7px seek flush to the bottom. */}
      <div className="buttons-bar flex flex-row items-center justify-between px-3 pb-3">
        <div className="flex flex-row items-center">
          <PlayButton
            className="vds-button mr-[5px] size-[35px] shrink-0 rounded-full"
            style={{
              backgroundColor: DESKTOP_COLOR.playBg,
              color: DESKTOP_COLOR.playFg,
            }}
            aria-label={paused ? 'Riproduci' : 'Pausa'}
          >
            {paused
              ? <PlayIcon className="vds-icon size-[25px]" />
              : <PauseIcon className="vds-icon size-[25px]" />
            }
          </PlayButton>

          <FullscreenButton
            className="vds-button mr-[5px] size-[35px] shrink-0"
            aria-label={fullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
          >
            {fullscreen
              ? <FullscreenExitIcon className="vds-icon size-[25px]" />
              : <FullscreenIcon className="vds-icon size-[25px]" />
            }
          </FullscreenButton>

          <MuteButton
            className="vds-button mr-3 size-[35px] shrink-0"
            aria-label={muted ? 'Riattiva audio' : 'Silenzia'}
          >
            {(muted || volume === 0)
              ? <MuteIcon className="vds-icon size-[25px]" />
              : volume < 0.5
                ? <VolumeLowIcon className="vds-icon size-[25px]" />
                : <VolumeHighIcon className="vds-icon size-[25px]" />
            }
          </MuteButton>

          <VolumeSlider.Root
            className="vds-slider"
            style={DESKTOP_VOLUME_STYLE}
          >
            <VolumeSlider.Track className="vds-slider-track rounded-none!" />
            <VolumeSlider.TrackFill className="vds-slider-track-fill vds-slider-track rounded-none!" />
            <VolumeSlider.Thumb className="vds-slider-thumb opacity-100 border-0" />
          </VolumeSlider.Root>
        </div>

        <div className="vds-time-group text-xs">
          <Time className="vds-time text-xs" type="current" />
          <span className="vds-time-divider">/</span>
          <Time className="vds-time text-xs" type="duration" />
        </div>
      </div>

      <div className="flex h-[7px] w-full flex-col">
        <TimeSlider.Root
          className="vds-time-slider vds-slider"
          style={DESKTOP_TIMELINE_STYLE}
          pauseWhileDragging
        >
          <TimeSlider.Track className="vds-slider-track rounded-none!" />
          <TimeSlider.TrackFill className="vds-slider-track-fill vds-slider-track rounded-none!" />
          <TimeSlider.Progress className="vds-slider-progress vds-slider-track rounded-none!" />
          <TimeSlider.Thumb className="vds-slider-thumb opacity-100 border-0" />
        </TimeSlider.Root>
      </div>
    </Controls.Group>
  );
}

// ─── PlayerUI ─────────────────────────────────────────────────────────────────
function PlayerUI() {
  const paused = useMediaState('paused');
  const isDesktop = useIsDesktop();

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
      <Gesture
        className="absolute inset-0"
        event="click"
        action="toggle:paused"
      />
      <Gesture
        className="vds-gesture"
        event="pointerup"
        action="toggle:controls"
      />

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-200 ${
          flash ? 'opacity-20' : 'opacity-0'
        }`}
      />

      {/*
        Only one chrome at a time. Desktop group is absolute bottom-0 so the
        seek bar sits flush on the video edge (project 04 alignment).
      */}
      <Controls.Root className="vds-controls justify-end" hideDelay={3000}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-25 bg-linear-to-t from-black via-black/85 to-transparent"
        />
        {isDesktop ? <DesktopControls /> : <MobileControls />}
      </Controls.Root>
    </>
  );
}

// ─── VimeoPlayer ──────────────────────────────────────────────────────────────

/**
 * @param {{ vimeoId: string; title: string; className?: string }} props
 */
export function VimeoPlayer({ vimeoId, title, className }) {
  return (
    <div className={["relative w-full max-w-5xl", className].filter(Boolean).join(" ")}>
      <MediaPlayer
        viewType="video"
        aspectRatio="16/9"
        className="w-full overflow-hidden bg-black shadow-sm"
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
