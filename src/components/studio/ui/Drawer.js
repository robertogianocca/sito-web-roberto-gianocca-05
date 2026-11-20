"use client";

import { useEffect, useId, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function focusableIn(container) {
  return [...container.querySelectorAll(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0
  );
}

/**
 * Side panel dialog used by every studio drawer.
 *
 * - `role="dialog"` + `aria-modal`, named by its title.
 * - Escape or a click on the backdrop closes it. A child that handles Escape
 *   itself (closing a list, cancelling a rename) calls `preventDefault()` or
 *   `stopPropagation()` and the drawer stays open.
 * - On open, focus moves to the element marked `data-autofocus`, else the
 *   first field of the body; Tab and Shift+Tab stay inside the panel; on
 *   close, focus goes back to the element that opened it.
 * - Closed, it stays mounted (for the slide animation) but `inert`: nothing
 *   in it can be focused or read by a screen reader.
 */
export function Drawer({
  open,
  onClose,
  title,
  closeLabel = "Close",
  widthClass = "max-w-lg",
  children,
}) {
  const titleId = useId();
  const panelRef = useRef(null);
  const bodyRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    const panel = panelRef.current;
    const returnFocusTo = document.activeElement;

    const body = bodyRef.current;
    const initial =
      panel.querySelector("[data-autofocus]") ??
      (body && focusableIn(body)[0]) ??
      panel;
    initial.focus({ preventScroll: true });

    function onKeyDown(e) {
      if (e.key === "Escape") {
        if (!e.defaultPrevented) {
          e.preventDefault();
          onCloseRef.current();
        }
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusableIn(panel);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items.at(-1);
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (returnFocusTo instanceof HTMLElement && document.contains(returnFocusTo)) {
        returnFocusTo.focus({ preventScroll: true });
      }
    };
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden
        />
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        inert={open ? undefined : true}
        className={`fixed inset-y-0 right-0 z-50 flex w-full ${widthClass} flex-col bg-background shadow-2xl outline-none transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 id={titleId} className="text-base font-semibold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-foreground focus-visible:outline-2 focus-visible:outline-zinc-400"
            aria-label={closeLabel}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div ref={bodyRef} className="flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </div>
    </>
  );
}
