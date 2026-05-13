"use client";

/**
 * Tuning guide (friction, speed, clamps): docs/horizontal-wheel-tuning.md
 */

import { useEffect, useRef } from "react";

/** Higher = longer glide (ease-out tail). */
const FRICTION = 0.935;
const EPSILON = 0.28;
const MAX_VELOCITY = 2800;
/** Minimum impulse so small mouse notches still move (macOS often uses pixel deltas < 18). */
const MIN_IMPULSE = 6;

/**
 * Desktop: map mouse wheel (vertical) to horizontal scroll on this element.
 * Mouse path uses velocity + friction (ease-out coasting). Horizontal-dominant wheel stays native (trackpad).
 */
export function HorizontalScrollContainer({ className = "", children, ...props }) {
  const ref = useRef(null);

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

    const onEnter = () => {
      isHovering = true;
    };

    const onLeave = () => {
      isHovering = false;
      stopMomentum();
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

      velocity *= Math.pow(FRICTION, dt / 16.67);

      if (Math.abs(velocity) < EPSILON) {
        stopMomentum();
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
      if (!isHovering) return;
      if (!isDesktop()) return;
      if (e.shiftKey) return;

      if (el.scrollWidth <= el.clientWidth) return;

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
    <main ref={ref} className={className} {...props}>
      {children}
    </main>
  );
}
