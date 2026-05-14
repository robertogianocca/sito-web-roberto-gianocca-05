import Link from "next/link";
import { revalidatePhotographyCaches } from "./actions";

export const metadata = {
  title: "Rigenera cache Photography | Roberto Gianocca",
  robots: { index: false, follow: false },
};

export default async function PhotographyRevalidateCachePage({ searchParams }) {
  const sp = await searchParams;
  const ok = sp.ok === "1";
  const err = sp.error === "1";

  return (
    <div className="mx-auto max-w-md space-y-8 px-6 py-16">
      <div className="space-y-2">
        <Link
          href="/photography"
          className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-foreground hover:underline dark:text-zinc-400"
        >
          ← Photography
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Rigenera cache gallerie
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Dopo aver modificato immagini o cartelle su Cloudinary, invia il form per svuotare la cache
          server e rigenerare le pagine statiche. Serve la variabile{" "}
          <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-xs dark:bg-zinc-800/80">
            REVALIDATION_SECRET
          </code>{" "}
          nel file <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-xs dark:bg-zinc-800/80">.env</code>{" "}
          (stesso valore che inserisci qui).
        </p>
      </div>

      {ok ? (
        <p className="rounded-lg border border-emerald-200/90 bg-emerald-50/90 p-4 text-sm text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100">
          Cache aggiornata. Puoi tornare alle gallerie.
        </p>
      ) : null}
      {err ? (
        <p className="rounded-lg border border-amber-200/90 bg-amber-50/90 p-4 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
          Segreto non valido o <code className="font-mono text-xs">REVALIDATION_SECRET</code> non impostato.
        </p>
      ) : null}

      <form action={revalidatePhotographyCaches} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="secret" className="text-sm font-medium text-foreground">
            Segreto di rivalidazione
          </label>
          <input
            id="secret"
            name="secret"
            type="password"
            required
            autoComplete="off"
            className="w-full rounded-lg border border-zinc-300/90 bg-background px-3 py-2 text-sm text-foreground outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700/90 dark:ring-zinc-500"
            placeholder="REVALIDATION_SECRET"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Rigenera cache
        </button>
      </form>
    </div>
  );
}
