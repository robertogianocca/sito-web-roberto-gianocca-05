"use client";

export function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search title, client, ID…"
        className="h-8 w-64 rounded-lg border border-zinc-300 bg-background pl-8 pr-3 text-sm text-foreground outline-none ring-zinc-400 focus:ring-2 placeholder:text-zinc-400"
      />
    </div>
  );
}
