/**
 * Global footer shell (slate-400 + grain). Per-route content via @footer parallel route.
 */
export function SiteFooter({ children }) {
  return (
    <footer className="site-chrome-grain pointer-events-none fixed bottom-0 left-0 z-10 h-(--site-footer-height) w-full overflow-hidden bg-slate-400 px-6 pt-3 md:px-10">
      <div className="relative z-1 pointer-events-auto">{children}</div>
    </footer>
  );
}
