/**
 * Global footer shell (matches sito-web-roberto-gianocca-04: 25% height, slate-400).
 * Per-route content via @footer parallel route slot in [locale]/layout.js.
 */
export function SiteFooter({ children }) {
  return (
    <footer className="footer-grain pointer-events-none fixed bottom-0 left-0 z-10 h-[25%] w-full overflow-hidden bg-slate-400 px-8 pt-4">
      <div className="relative z-1 pointer-events-auto">{children}</div>
    </footer>
  );
}
