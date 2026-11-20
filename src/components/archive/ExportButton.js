"use client";

import { useState, useRef } from "react";
import { useOutsideClick } from "@/components/studio/hooks/useOutsideClick";

export function ExportButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, () => setOpen(false), open);

  function onKeyDown(e) {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      ref.current?.querySelector("button")?.focus();
    }
  }

  function download(format) {
    setOpen(false);
    window.location.href = `/api/archive/export?format=${format}`;
  }

  return (
    <div ref={ref} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-300 bg-background px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-foreground"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export
        <svg
          className="h-3 w-3 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 min-w-[10rem] overflow-hidden rounded-lg border border-zinc-200 bg-background shadow-lg">
          <button
            type="button"
            onClick={() => download("xlsx")}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-zinc-100"
          >
            <span className="font-mono text-2xs text-zinc-400">xlsx</span>
            Excel / Numbers
          </button>
          <button
            type="button"
            onClick={() => download("csv")}
            className="flex w-full items-center gap-2 border-t border-zinc-100 px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-zinc-100"
          >
            <span className="font-mono text-2xs text-zinc-400">csv</span>
            CSV (universal)
          </button>
        </div>
      )}
    </div>
  );
}
