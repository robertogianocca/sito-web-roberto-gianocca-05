"use client";

import { useEffect, useRef } from "react";

/** Calls `onOutside` on a mouse/touch press outside `ref`, while `enabled`. */
export function useOutsideClick(ref, onOutside, enabled = true) {
  const handlerRef = useRef(onOutside);
  useEffect(() => {
    handlerRef.current = onOutside;
  });

  useEffect(() => {
    if (!enabled) return undefined;
    function onPointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) handlerRef.current(e);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [ref, enabled]);
}
