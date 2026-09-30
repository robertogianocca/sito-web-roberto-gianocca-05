'use client';

// VidStack foundational CSS — layout, slider mechanics, controls visibility,
// button sizing, time display. Colours are overridden via CSS custom properties.
import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/default/sliders.css';
import '@vidstack/react/player/styles/default/controls.css';
import '@vidstack/react/player/styles/default/buttons.css';
import '@vidstack/react/player/styles/default/time.css';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
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
  formatTime,
  useMediaRemote,
  useMediaState,
  useSliderState,
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
const PREVIEW_MQ = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';

function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function useIsDesktop() {
  return useMediaQuery(DESKTOP_MQ);
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
  // Track stays flush to the player bottom (7px). Thumb is bottom-anchored
  // via CSS so the 12px circle grows upward and is not clipped by overflow.
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

/** Desktop chrome: subtle circles + hover-reveal volume. */

const DESKTOP_BTN =
  'vds-button size-[35px] shrink-0 rounded-full transition-colors duration-150';

const DESKTOP_PLAY_BTN = `${DESKTOP_BTN}`;

/** Permanent low-contrast circle; fills green on hover/focus. */
const DESKTOP_SECONDARY_CIRCLE = [
  DESKTOP_BTN,
  'desktop-secondary-circle',
].join(' ');

const DESKTOP_BTN_SIZE_STYLE = {
  width: '35px',
  height: '35px',
  minWidth: '35px',
  minHeight: '35px',
};

const DESKTOP_PLAY_STYLE = {
  ...DESKTOP_BTN_SIZE_STYLE,
  backgroundColor: DESKTOP_COLOR.playBg,
  color: DESKTOP_COLOR.playFg,
  // Override VidStack default hover wash / scale on the solid play disc.
  '--media-button-hover-bg': DESKTOP_COLOR.playBg,
  '--media-button-hover-transform': 'none',
};

const DESKTOP_SECONDARY_CIRCLE_STYLE = {
  ...DESKTOP_BTN_SIZE_STYLE,
  border: '1.5px solid rgb(0 201 52 / 0.55)',
  backgroundColor: 'rgb(0 0 0 / 0.45)',
  color: DESKTOP_COLOR.accent,
  '--media-button-hover-bg': DESKTOP_COLOR.playBg,
  '--media-button-hover-transform': 'none',
};

const DESKTOP_ICON = 'vds-icon size-[25px]';

const DESKTOP_VOLUME_REVEAL_STYLE = {
  ...DESKTOP_VOLUME_STYLE,
  width: '100%',
};

function DesktopPlayButton({ paused }) {
  return (
    <PlayButton
      className={DESKTOP_PLAY_BTN}
      style={DESKTOP_PLAY_STYLE}
      aria-label={paused ? 'Riproduci' : 'Pausa'}
    >
      {paused
        ? <PlayIcon className={DESKTOP_ICON} />
        : <PauseIcon className={DESKTOP_ICON} />
      }
    </PlayButton>
  );
}

function DesktopFullscreenButton({ fullscreen, className, style }) {
  return (
    <FullscreenButton
      className={className}
      style={style}
      aria-label={fullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
    >
      {fullscreen
        ? <FullscreenExitIcon className={DESKTOP_ICON} />
        : <FullscreenIcon className={DESKTOP_ICON} />
      }
    </FullscreenButton>
  );
}

function DesktopMuteButton({ muted, volume, className, style }) {
  return (
    <MuteButton
      className={className}
      style={style}
      aria-label={muted ? 'Riattiva audio' : 'Silenzia'}
    >
      {(muted || volume === 0)
        ? <MuteIcon className={DESKTOP_ICON} />
        : volume < 0.5
          ? <VolumeLowIcon className={DESKTOP_ICON} />
          : <VolumeHighIcon className={DESKTOP_ICON} />
      }
    </MuteButton>
  );
}

function DesktopVolumeSlider() {
  return (
    <VolumeSlider.Root className="vds-slider" style={DESKTOP_VOLUME_REVEAL_STYLE}>
      <VolumeSlider.Track className="vds-slider-track rounded-none!" />
      <VolumeSlider.TrackFill className="vds-slider-track-fill vds-slider-track rounded-none!" />
      <VolumeSlider.Thumb className="vds-slider-thumb opacity-100 border-0" />
    </VolumeSlider.Root>
  );
}

const VOLUME_HIDE_DELAY_MS = 1100;

/**
 * Mute + volume: opens on hover/focus. After a finished volume drag it closes
 * on a short delay even if the pointer is still over the control; hovering
 * again after leaving reopens it.
 */
function DesktopVolumeControl({ muted, volume }) {
  const [open, setOpen] = useState(false);
  const hideTimerRef = useRef(null);
  const previousVolumeRef = useRef(volume);
  /** After a volume adjust we hide and ignore hover until the pointer leaves. */
  const dismissedRef = useRef(false);

  function clearHideTimer() {
    if (hideTimerRef.current == null) return;
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }

  function scheduleHide({ afterAdjust = false } = {}) {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      setOpen(false);
      if (afterAdjust) dismissedRef.current = true;
    }, VOLUME_HIDE_DELAY_MS);
  }

  function showVolume() {
    if (dismissedRef.current) return;
    clearHideTimer();
    setOpen(true);
  }

  useEffect(() => {
    if (previousVolumeRef.current === volume) return;
    previousVolumeRef.current = volume;
    if (open) scheduleHide({ afterAdjust: true });
  }, [open, volume]);

  useEffect(() => () => clearHideTimer(), []);

  return (
    <div
      className={[
        'desktop-volume-group flex h-[35px] items-center',
        open ? 'is-open' : '',
      ].filter(Boolean).join(' ')}
      onMouseEnter={() => {
        showVolume();
      }}
      onMouseLeave={() => {
        dismissedRef.current = false;
        scheduleHide();
      }}
      onFocusCapture={() => {
        if (!dismissedRef.current) showVolume();
      }}
      onBlurCapture={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        scheduleHide();
      }}
    >
      <DesktopMuteButton
        muted={muted}
        volume={volume}
        className={DESKTOP_SECONDARY_CIRCLE}
        style={DESKTOP_SECONDARY_CIRCLE_STYLE}
      />
      <div
        className="desktop-volume-rail ml-0 overflow-hidden"
        onPointerDown={() => {
          dismissedRef.current = false;
          clearHideTimer();
          setOpen(true);
        }}
      >
        <div className="flex h-[35px] w-[60px] items-center pl-1.5">
          <DesktopVolumeSlider />
        </div>
      </div>
    </div>
  );
}

function DesktopTimeGroup() {
  return (
    <div className="vds-time-group text-xs">
      <Time className="vds-time text-xs" type="current" />
      <span className="vds-time-divider">/</span>
      <Time className="vds-time text-xs" type="duration" />
    </div>
  );
}

/**
 * Hover/drag timestamp above the seek bar (project 04 UX) without using
 * TimeSlider.Preview — that component has a React 19 teardown race.
 * Must render inside a TimeSlider.Root so useSliderState has context.
 */
function SeekTimePreview({ variant = 'desktop' }) {
  const pointing = useSliderState('pointing');
  const dragging = useSliderState('dragging');
  const pointerValue = useSliderState('pointerValue');
  const pointerPercent = useSliderState('pointerPercent');

  const visible = pointing || dragging;
  // Keep the label inside the player: ~half the chip width as percent margin.
  const left = Math.min(Math.max(pointerPercent ?? 0, 6), 94);
  const label = formatTime(Math.max(0, pointerValue ?? 0), { padMins: true });

  return (
    <div
      className={[
        'seek-time-preview',
        variant === 'mobile' ? 'seek-time-preview--mobile' : 'seek-time-preview--desktop',
        visible ? 'is-visible' : '',
      ].filter(Boolean).join(' ')}
      style={{ left: `${left}%` }}
      aria-hidden={!visible}
    >
      {label}
    </div>
  );
}

function DesktopSeekBar() {
  return (
    <div className="desktop-seek-bar flex h-[7px] w-full flex-col">
      <TimeSlider.Root
        className="vds-time-slider vds-slider"
        style={DESKTOP_TIMELINE_STYLE}
        pauseWhileDragging
      >
        <TimeSlider.Track className="vds-slider-track rounded-none!" />
        <TimeSlider.TrackFill className="vds-slider-track-fill vds-slider-track rounded-none!" />
        <TimeSlider.Progress className="vds-slider-progress vds-slider-track rounded-none!" />
        <TimeSlider.Thumb className="vds-slider-thumb opacity-100 border-0" />
        <SeekTimePreview variant="desktop" />
      </TimeSlider.Root>
    </div>
  );
}

/** Full-frame hit target + green play — used before first start (homepage). */
function IdlePlaySurface({ isDesktop }) {
  const remote = useMediaRemote();
  const waiting = useMediaState('waiting');

  function play() {
    if (waiting) return;
    remote.play();
  }

  return (
    <button
      type="button"
      disabled={waiting}
      onClick={play}
      aria-label="Riproduci"
      aria-busy={waiting || undefined}
      className="absolute inset-0 z-20 cursor-pointer border-0 bg-transparent p-0 disabled:cursor-wait"
    >
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={isDesktop ? DESKTOP_CONTROLS_STYLE : undefined}
      >
        <span className="absolute inset-x-0 bottom-0 h-25 bg-linear-to-t from-black via-black/85 to-transparent" />
        <span className="relative flex items-center gap-1.5 px-3 pb-3">
          <span
            className="flex size-[35px] shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: DESKTOP_COLOR.playBg,
              color: DESKTOP_COLOR.playFg,
              opacity: waiting ? 0.7 : 1,
            }}
          >
            <PlayIcon className="size-[25px]" />
          </span>
        </span>
        <span className="block h-[7px] w-full" aria-hidden />
      </span>
    </button>
  );
}

const PREVIEW_FADE_OUT_MS = 900;
const PREVIEW_START_TIMEOUT_MS = 3000;

/** Cloudinary still of the clip's first frame (same asset, `.jpg` + `so_0`). */
function previewFirstFrameUrl(src) {
  return src.replace('/video/upload/', '/video/upload/so_0/').replace(/\.mp4$/, '.jpg');
}

/**
 * Opaque stage over the whole player with a muted teaser clip (project 04
 * UX). The stage is shown by CSS breakpoints (same query as PREVIEW_MQ) so it
 * is server-rendered and hides cover/controls from the first frame; its
 * background is the clip's first frame, so the clip starts seamlessly with no
 * fade. Only the <video> waits for the client check, so mobile never
 * downloads it (background images of display:none elements are not fetched).
 * The stage fades out on ended, click (which also plays), error, blocked
 * autoplay, playback started elsewhere, or if the clip has not started within
 * PREVIEW_START_TIMEOUT_MS.
 */
function PreviewIntro({ src }) {
  const remote = useMediaRemote();
  const started = useMediaState('started');
  const canPreview = useMediaQuery(PREVIEW_MQ);
  const videoRef = useRef(null);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);
  const leaving = done || started;

  useEffect(() => {
    if (!canPreview) return;
    videoRef.current?.play()?.catch(() => setDone(true));
  }, [canPreview]);

  useEffect(() => {
    if (shown || leaving) return;
    const id = setTimeout(() => setDone(true), PREVIEW_START_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [shown, leaving]);

  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => setGone(true), PREVIEW_FADE_OUT_MS);
    return () => clearTimeout(id);
  }, [leaving]);

  if (gone) return null;

  function skip() {
    setDone(true);
    remote.play();
  }

  return (
    <button
      type="button"
      onClick={skip}
      aria-label="Riproduci"
      className={[
        'absolute inset-0 z-[5] hidden cursor-pointer border-0 bg-black bg-cover bg-center p-0 motion-safe:lg:block',
        leaving
          ? 'pointer-events-none opacity-0 transition-opacity ease-out'
          : 'opacity-100',
      ].join(' ')}
      style={{
        backgroundImage: `url("${previewFirstFrameUrl(src)}")`,
        ...(leaving ? { transitionDuration: `${PREVIEW_FADE_OUT_MS}ms` } : {}),
      }}
    >
      {canPreview ? (
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setShown(true)}
          onEnded={() => setDone(true)}
          onError={() => setDone(true)}
          className="pointer-events-none h-full w-full object-cover"
        />
      ) : null}
    </button>
  );
}

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
        <SeekTimePreview variant="mobile" />
      </TimeSlider.Root>
    </Controls.Group>
  );
}

// ─── Desktop controls (subtle circles + hover-reveal volume) ──────────────────

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
      <div className="buttons-bar flex flex-row items-center justify-between px-3 pb-3">
        <div className="flex flex-row items-center gap-1.5">
          <DesktopPlayButton paused={paused} />
          <DesktopFullscreenButton
            fullscreen={fullscreen}
            className={DESKTOP_SECONDARY_CIRCLE}
            style={DESKTOP_SECONDARY_CIRCLE_STYLE}
          />
          <DesktopVolumeControl muted={muted} volume={volume} />
        </div>
        <DesktopTimeGroup />
      </div>
      <DesktopSeekBar />
    </Controls.Group>
  );
}

const COVER_INSTANT_MS = 100;

/**
 * Cover on a black backdrop (also hides the Vimeo iframe's own thumbnail).
 * A cached cover shows instantly; only one still loading after
 * COVER_INSTANT_MS is hidden and faded in, so it never pops in after black.
 */
function PlayerCover({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const id = setTimeout(() => setSlow(true), COVER_INSTANT_MS);
    return () => clearTimeout(id);
  }, [loaded]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] bg-black">
      <Image
        src={src}
        alt={alt ?? ""}
        fill
        sizes="(min-width: 1024px) 66vw, 100vw"
        loading="eager"
        fetchPriority="high"
        onLoad={() => setLoaded(true)}
        className={[
          'object-cover',
          slow ? 'transition-opacity duration-300 ease-out' : '',
          slow && !loaded ? 'opacity-0' : 'opacity-100',
        ].filter(Boolean).join(' ')}
      />
    </div>
  );
}

// ─── PlayerUI ─────────────────────────────────────────────────────────────────
function PlayerUI({
  idlePlayOnly = false,
  poster,
  posterAlt,
  preview,
}) {
  const paused = useMediaState('paused');
  const started = useMediaState('started');
  const playing = useMediaState('playing');
  const isDesktop = useIsDesktop();
  const playOnly = idlePlayOnly && !started;

  // Keep the cover until real frames are playing (not merely "started").
  const [coverGone, setCoverGone] = useState(false);
  if (playing && !coverGone) setCoverGone(true);
  const showPosterCover = Boolean(poster) && !coverGone;

  const [flash, setFlash] = useState(false);
  const prevPaused = useRef(paused);
  useEffect(() => {
    if (playOnly) return;
    if (prevPaused.current === paused) return;
    prevPaused.current = paused;
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 220);
    return () => clearTimeout(id);
  }, [paused, playOnly]);

  return (
    <>
      {showPosterCover ? <PlayerCover src={poster} alt={posterAlt} /> : null}

      {!playOnly ? (
        <>
          <Gesture
            className="absolute inset-0 z-[2]"
            event="click"
            action="toggle:paused"
          />
          {started ? (
            <Gesture
              className="vds-gesture"
              event="pointerup"
              action="toggle:controls"
            />
          ) : null}
        </>
      ) : null}

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-[2] bg-black transition-opacity duration-200 ${
          flash ? 'opacity-20' : 'opacity-0'
        }`}
      />

      {/*
        Idle play must live OUTSIDE `.vds-controls`. Video controls start hidden
        (opacity 0) and only get `[data-visible]` after interaction — so a play
        button inside Controls fades away on homepage load.
      */}
      {playOnly ? (
        <IdlePlaySurface isDesktop={isDesktop} />
      ) : (
        <Controls.Root
          className={[
            'vds-controls z-[4] justify-end',
            started ? '' : 'player-controls-ready',
          ].filter(Boolean).join(' ')}
          hideDelay={started ? 3000 : 1e8}
          hideOnMouseLeave={started}
          style={started ? undefined : {
            '--media-controls-in-transition': 'none',
            '--media-controls-out-transition': 'none',
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-25 bg-linear-to-t from-black via-black/85 to-transparent"
          />
          {isDesktop ? <DesktopControls /> : <MobileControls />}
        </Controls.Root>
      )}

      {preview ? <PreviewIntro src={preview} /> : null}
    </>
  );
}

// ─── VimeoPlayer ──────────────────────────────────────────────────────────────

/**
 * @param {{
 *   vimeoId: string;
 *   title: string;
 *   className?: string;
 *   autoPlay?: boolean;
 *   poster?: string;
 *   posterAlt?: string;
 *   preview?: string;
 *   load?: 'eager' | 'idle' | 'visible' | 'play';
 *   idlePlayOnly?: boolean;
 * }} props
 */
export function VimeoPlayer({
  vimeoId,
  title,
  className,
  autoPlay = false,
  poster,
  posterAlt,
  preview,
  load = 'visible',
  idlePlayOnly = false,
}) {
  return (
    <div className={["relative w-full max-w-5xl", className].filter(Boolean).join(" ")}>
      <MediaPlayer
        viewType="video"
        aspectRatio="16/9"
        className="w-full overflow-hidden bg-black shadow-sm"
        title={title}
        src={`vimeo/${vimeoId}`}
        poster={poster}
        load={load}
        playsInline
        autoPlay={autoPlay}
        style={PLAYER_STYLE}
      >
        <MediaProvider />
        <PlayerUI
          idlePlayOnly={idlePlayOnly}
          poster={poster}
          posterAlt={posterAlt ?? title}
          preview={preview}
        />
      </MediaPlayer>
    </div>
  );
}
