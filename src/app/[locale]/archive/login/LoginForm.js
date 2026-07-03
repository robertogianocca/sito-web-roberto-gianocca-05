"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

const initialState = { error: null };

export function LoginForm({ locale }) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm text-foreground outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50"
          placeholder="••••••••"
          disabled={isPending}
        />
      </div>

      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-700 disabled:opacity-60"
      >
        {isPending ? "Verifying…" : "Enter Archive"}
      </button>
    </form>
  );
}
