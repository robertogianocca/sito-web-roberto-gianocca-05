"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitContactAction } from "@/app/contact/actions";

const initialContactState = {
  ok: false,
  resetKey: 0,
  errors: {},
};

const inputClassName =
  "w-full rounded-lg border border-zinc-300/90 bg-background px-3 py-2 text-sm text-foreground outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700/90 dark:ring-zinc-500";

function fieldErrorId(name) {
  return `${name}-error`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "Invio in corso…" : "Invia messaggio"}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactAction, initialContactState);

  return (
    <div className="space-y-4">
      {state.ok ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-200/90 bg-emerald-50/90 p-3 text-sm text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100"
        >
          Messaggio inviato. Ti risponderò al più presto.
        </p>
      ) : null}

      {state.errors?.submission ? (
        <p
          role="alert"
          className="rounded-lg border border-amber-200/90 bg-amber-50/90 p-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100"
        >
          {state.errors.submission}
        </p>
      ) : null}

      <form
        key={state.resetKey}
        action={formAction}
        className="space-y-3"
        noValidate
      >
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
          <label htmlFor="website">Sito web</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            aria-invalid={state.errors?.name ? true : undefined}
            aria-describedby={state.errors?.name ? fieldErrorId("name") : undefined}
            className={inputClassName}
          />
          {state.errors?.name ? (
            <p id={fieldErrorId("name")} className="text-xs text-amber-800 dark:text-amber-200">
              {state.errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={state.errors?.email ? true : undefined}
            aria-describedby={state.errors?.email ? fieldErrorId("email") : undefined}
            className={inputClassName}
          />
          {state.errors?.email ? (
            <p id={fieldErrorId("email")} className="text-xs text-amber-800 dark:text-amber-200">
              {state.errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="subject" className="text-sm font-medium text-foreground">
            Oggetto
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            aria-invalid={state.errors?.subject ? true : undefined}
            aria-describedby={state.errors?.subject ? fieldErrorId("subject") : undefined}
            className={inputClassName}
          />
          {state.errors?.subject ? (
            <p id={fieldErrorId("subject")} className="text-xs text-amber-800 dark:text-amber-200">
              {state.errors.subject}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="message" className="text-sm font-medium text-foreground">
            Messaggio
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={4}
            aria-invalid={state.errors?.message ? true : undefined}
            aria-describedby={state.errors?.message ? fieldErrorId("message") : undefined}
            className={`${inputClassName} resize-y min-h-[6rem]`}
          />
          {state.errors?.message ? (
            <p id={fieldErrorId("message")} className="text-xs text-amber-800 dark:text-amber-200">
              {state.errors.message}
            </p>
          ) : null}
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
