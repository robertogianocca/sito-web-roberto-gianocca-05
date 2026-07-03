import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "./LoginForm";

export async function generateMetadata() {
  return {
    title: "Archive — Login",
    robots: { index: false, follow: false },
  };
}

export default async function ArchiveLoginPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1">
          <p className="text-2xs font-mono uppercase tracking-widest text-zinc-500">
            Private
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Archive
          </h1>
          <p className="text-sm text-zinc-500">
            Enter your password to continue.
          </p>
        </div>
        <LoginForm locale={locale} />
      </div>
    </div>
  );
}
