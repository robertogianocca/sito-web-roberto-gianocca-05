"use client";

export function RestartButton({ timerActive, onClick, label = "Start timer" }) {
  return (
    <button
      type="button"
      disabled={timerActive}
      onClick={onClick}
      title={timerActive ? "Stop the current timer first" : label}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
  );
}
