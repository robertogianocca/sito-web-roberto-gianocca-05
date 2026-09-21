"use client";

import { Link, usePathname } from "@/i18n/navigation";

const TABS = [
  { href: "/studio/archive", label: "Archive" },
  { href: "/studio/time", label: "Time" },
];

export function StudioShell({ locale, logoutAction, children }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-background px-6 py-2">
        <div className="flex items-center gap-4">
          <p className="text-2xs font-mono uppercase tracking-widest text-zinc-400">
            Studio
          </p>
          <nav className="flex items-center gap-1" aria-label="Studio sections">
            {TABS.map((tab) => {
              const active =
                pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-zinc-900 text-zinc-50"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <form action={logoutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
            title="Log out"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </form>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
