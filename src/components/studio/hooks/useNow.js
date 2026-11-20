"use client";

import { useSyncExternalStore } from "react";

/**
 * Current time in ms, updated every second while `ticking` is true.
 *
 * Passing the time explicitly (instead of calling Date.now() inside render
 * helpers) lets React, and the React Compiler, see that the live clock depends
 * on it, so elapsed times re-render every second. One shared interval serves
 * every component that uses it.
 */
let now = Date.now();
const listeners = new Set();
let intervalId = null;

function subscribe(listener) {
  now = Date.now();
  listeners.add(listener);
  if (!intervalId) {
    intervalId = setInterval(() => {
      now = Date.now();
      for (const notify of listeners) notify();
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function subscribeNever() {
  return () => {};
}

function getSnapshot() {
  return now;
}

export function useNow(ticking = true) {
  return useSyncExternalStore(
    ticking ? subscribe : subscribeNever,
    getSnapshot,
    getSnapshot
  );
}
