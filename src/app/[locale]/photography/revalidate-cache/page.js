import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePhotographyCaches } from "./actions";
import {
  REVALIDATION_OK_VALUE,
  REVALIDATION_ERROR_VALUE,
} from "./constants";
import { BackLink } from "@/components/shared/BackLink";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RevalidateCache" });
  return {
    title: `${t("metaTitle")} | Roberto Gianocca`,
    robots: { index: false, follow: false },
  };
}

export default async function PhotographyRevalidateCachePage({ params, searchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("RevalidateCache");
  const sp = await searchParams;
  const ok = sp.ok === REVALIDATION_OK_VALUE;
  const err = sp.error === REVALIDATION_ERROR_VALUE;

  return (
    <div className="mx-auto max-w-md space-y-8 px-6 py-16">
      <div className="space-y-2">
        <BackLink href="/photography" label="Photography" />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {t("description")}
        </p>
      </div>

      {ok ? (
        <p className="rounded-lg border border-emerald-200/90 bg-emerald-50/90 p-4 text-sm text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100">
          {t("successMessage")}
        </p>
      ) : null}
      {err ? (
        <p className="rounded-lg border border-amber-200/90 bg-amber-50/90 p-4 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
          {t("errorMessage")}
        </p>
      ) : null}

      <form action={revalidatePhotographyCaches} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="secret" className="text-sm font-medium text-foreground">
            {t("secretLabel")}
          </label>
          <input
            id="secret"
            name="secret"
            type="password"
            required
            autoComplete="off"
            className="w-full rounded-lg border border-zinc-300/90 bg-background px-3 py-2 text-sm text-foreground outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700/90 dark:ring-zinc-500"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {t("submit")}
        </button>
      </form>
    </div>
  );
}
