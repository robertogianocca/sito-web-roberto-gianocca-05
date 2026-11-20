"use client";

/** A full-width row button with a ▸/▾ marker that opens or closes its group. */
export function ExpandToggle({ isOpen, onClick, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 text-left ${className}`}
    >
      <span className="text-zinc-400" aria-hidden>
        {isOpen ? "▾" : "▸"}
      </span>
      {children}
    </button>
  );
}
