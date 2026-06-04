"use client";

/**
 * Homepage horizontal scroll: docs/homepage-horizontal-scroll.md
 * Tuning (friction, speed, clamps, scroll hints): docs/horizontal-wheel-tuning.md
 */

import { useEffect, useRef, useState } from "react";

/** Higher = longer glide (ease-out tail). */
const FRICTION = 0.935;
const EPSILON = 0.28;
const MAX_VELOCITY = 2800;
/** Minimum impulse so small mouse notches still move (macOS often uses pixel deltas < 18). */
const MIN_IMPULSE = 6;

/**
 * Right-edge hints (gradient + «Scroll» pill): fade by scroll progress, not px-from-end.
 * Contact (span 4) appears before scrollLeft reaches max, so pixel-based fade kept hints
 * visible on Contatti. See docs/horizontal-wheel-tuning.md.
 */
const BUTTON_FADE_START = 0.62;
const GRADIENT_FADE_START = 0.82;

/** progress in [0,1]; fadeStart is progress above which opacity linearly goes to 0. */
function opacityFromProgress(progress, fadeStart) {
  if (progress <= fadeStart) return 1;
  const span = 1 - fadeStart;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(1, (1 - progress) / span));
}

/** Maps horizontal scroll position to overlay opacities (home only, when showScrollHints). */
function computeHintOpacities(el) {
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll <= 1) {
    return { gradientOpacity: 0, buttonOpacity: 0 };
  }
  const progress = Math.max(0, Math.min(1, el.scrollLeft / maxScroll));
  return {
    buttonOpacity: opacityFromProgress(progress, BUTTON_FADE_START),
    gradientOpacity: opacityFromProgress(progress, GRADIENT_FADE_START),
  };
}

function ScrollHintsOverlay({ gradientOpacity, buttonOpacity }) {
  const hidden = gradientOpacity === 0 && buttonOpacity === 0;

  return (
    <div
      className="pointer-events-none fixed inset-y-0 right-0 z-20 hidden w-40 lg:block"
      aria-hidden={hidden}
    >
      <div
        className="absolute inset-y-0 right-0 w-40 bg-linear-to-l from-background to-transparent transition-opacity duration-500 ease-out motion-reduce:transition-none"
        style={{ opacity: gradientOpacity }}
      />
      <div
        className="absolute right-6 top-1/2 -translate-y-1/2 transition-opacity duration-500 ease-out motion-reduce:transition-none"
        style={{ opacity: buttonOpacity }}
      >
        <div
          className={`flex items-center gap-2 rounded-full border border-zinc-300/60 bg-background/80 px-3 py-1 text-xs font-medium text-zinc-700 backdrop-blur dark:border-zinc-700/60 dark:bg-zinc-950/70 dark:text-zinc-200 ${
            buttonOpacity > 0.5 ? "motion-safe:animate-pulse" : ""
          }`}
        >
          <span>Scroll</span>
          <span aria-hidden>→</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Desktop: map mouse wheel (vertical) to horizontal scroll on this element.
 * Mouse path uses velocity + friction (ease-out coasting). Horizontal-dominant wheel stays native (trackpad).
 */
export function HorizontalScrollContainer({
  className = "",
  showScrollHints = false,
  children,
  ...props
}) {
  const ref = useRef(null);
  /** Called from wheel momentum RAF when scroll events may be sparse. */
  const updateHintsRef = useRef(() => {});
  const [hintOpacities, setHintOpacities] = useState({
    gradientOpacity: 1,
    buttonOpacity: 1,
  });

  useEffect(() => {
    if (!showScrollHints) return;

    const el = ref.current;
    if (!el) return;

    const updateHints = () => {
      setHintOpacities(computeHintOpacities(el));
    };
    updateHintsRef.current = updateHints;

    updateHints();
    el.addEventListener("scroll", updateHints, { passive: true });
    const resizeObserver = new ResizeObserver(updateHints);
    resizeObserver.observe(el);
    window.addEventListener("resize", updateHints);

    return () => {
      updateHintsRef.current = () => {};
      el.removeEventListener("scroll", updateHints);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHints);
    };
  }, [showScrollHints]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isDesktop = () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(min-width: 1024px)")?.matches;

    const prefersReducedMotion = () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    let isHovering = false;
    let velocity = 0;
    let rafId = 0;
    let lastTs = 0;

    const stopMomentum = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      velocity = 0;
      lastTs = 0;
    };

    const setHovering = (next) => {
      if (next === isHovering) return;
      isHovering = next;
      if (!next) stopMomentum();
    };

    const pointInsideEl = (clientX, clientY) => {
      const r = el.getBoundingClientRect();
      return (
        clientX >= r.left &&
        clientX < r.right &&
        clientY >= r.top &&
        clientY < r.bottom
      );
    };

    const onEnter = () => {
      setHovering(true);
    };

    const onLeave = () => {
      setHovering(false);
    };

    const tick = (ts) => {
      if (!isHovering || !el) {
        stopMomentum();
        return;
      }

      const dt = lastTs ? Math.min(40, ts - lastTs) : 16.67;
      lastTs = ts;

      const disp = velocity * (dt / 16.67);
      el.scrollLeft += disp;
      updateHintsRef.current();

      velocity *= Math.pow(FRICTION, dt / 16.67);

      if (Math.abs(velocity) < EPSILON) {
        stopMomentum();
        updateHintsRef.current();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    const scheduleTick = () => {
      if (rafId) return;
      lastTs = 0;
      rafId = requestAnimationFrame(tick);
    };

    const impulseFromWheel = (e) => {
      const dx = e.deltaX;
      const dy = e.deltaY;

      // Let clear horizontal-dominant gestures stay native (trackpad two-finger horizontal).
      if (Math.abs(dy) <= Math.abs(dx)) return 0;

      // Ignore sub-pixel noise.
      if (Math.abs(dy) < 0.05) return 0;

      const linePx = 10;
      const pagePx = Math.max(320, el.clientWidth * 0.7);
      const factor = e.deltaMode === 1 ? linePx : e.deltaMode === 2 ? pagePx : 1;
      const speed = 0.5;
      let raw = dy * factor * speed;

      // Boost tiny pixel-mode steps (mouse) without affecting large line/page steps much.
      if (e.deltaMode === 0 && Math.abs(raw) > 0 && Math.abs(raw) < 14) {
        raw *= 1.35;
      }

      let clamped = Math.max(-260, Math.min(260, raw));
      if (clamped !== 0 && Math.abs(clamped) < MIN_IMPULSE) {
        clamped = Math.sign(clamped) * MIN_IMPULSE;
      }

      return clamped;
    };

    const onWheel = (e) => {
      if (!isDesktop()) return;
      if (e.shiftKey) return;

      if (el.scrollWidth <= el.clientWidth) return;

      // Soft navigation (e.g. back from /photography): the pointer can sit over the
      // track without a new pointerenter, so derive "inside" from the wheel event.
      if (pointInsideEl(e.clientX, e.clientY)) {
        setHovering(true);
      } else {
        setHovering(false);
        return;
      }

      const impulse = impulseFromWheel(e);
      if (!impulse) return;

      e.preventDefault();

      if (prefersReducedMotion()) {
        stopMomentum();
        el.scrollBy({ left: impulse, top: 0, behavior: "auto" });
        return;
      }

      velocity = Math.max(
        -MAX_VELOCITY,
        Math.min(MAX_VELOCITY, velocity + impulse),
      );
      scheduleTick();
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });

    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("wheel", onWheel, { capture: true });
      stopMomentum();
    };
  }, []);

  return (
    <>
      {showScrollHints ? <ScrollHintsOverlay {...hintOpacities} /> : null}
      <main ref={ref} className={className} {...props}>
        {children}
      </main>
    </>
  );
}
