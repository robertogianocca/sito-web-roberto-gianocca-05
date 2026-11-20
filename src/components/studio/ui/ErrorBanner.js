/** Error message shown in a panel or a view; announced by screen readers. */
export function ErrorBanner({ children, className = "" }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className={`rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 ${className}`}
    >
      {children}
    </p>
  );
}
