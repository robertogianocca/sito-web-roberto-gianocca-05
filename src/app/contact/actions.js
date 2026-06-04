"use server";

import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const initialContactState = {
  ok: false,
  resetKey: 0,
  errors: {},
};

function field(value) {
  return String(value ?? "").trim();
}

function validateContact({ name, email, subject, message }) {
  const errors = {};

  if (name.length < 2) {
    errors.name = "Inserisci almeno 2 caratteri.";
  } else if (name.length > 100) {
    errors.name = "Il nome è troppo lungo.";
  }

  if (!email) {
    errors.email = "L’email è obbligatoria.";
  } else if (email.length > 254) {
    errors.email = "L’email è troppo lunga.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Inserisci un indirizzo email valido.";
  }

  if (subject.length < 3) {
    errors.subject = "Inserisci almeno 3 caratteri.";
  } else if (subject.length > 200) {
    errors.subject = "L’oggetto è troppo lungo.";
  }

  if (message.length < 10) {
    errors.message = "Il messaggio deve avere almeno 10 caratteri.";
  } else if (message.length > 5000) {
    errors.message = "Il messaggio è troppo lungo.";
  }

  return errors;
}

/**
 * Invia il form contatti via Resend.
 * Env: RESEND_API_KEY, RESEND_FROM_EMAIL, CONTACT_TO_EMAIL (vedi docs/contact-form-resend.md).
 */
export async function submitContactAction(prevState, formData) {
  const website = field(formData.get("website"));
  if (website) {
    return { ok: true, resetKey: (prevState?.resetKey ?? 0) + 1, errors: {} };
  }

  const name = field(formData.get("name"));
  const email = field(formData.get("email"));
  const subject = field(formData.get("subject"));
  const message = field(formData.get("message"));

  const fieldErrors = validateContact({ name, email, subject, message });
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, resetKey: prevState?.resetKey ?? 0, errors: fieldErrors };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !from || !to) {
    if (process.env.NODE_ENV === "development") {
      console.error("[contact] Missing RESEND_API_KEY, RESEND_FROM_EMAIL, or CONTACT_TO_EMAIL");
    }
    return {
      ok: false,
      resetKey: prevState?.resetKey ?? 0,
      errors: {
        submission:
          "Il servizio email non è configurato. Riprova più tardi o contattami con un altro canale.",
      },
    };
  }

  const resend = new Resend(apiKey);
  const safeSubject = subject.replace(/[\r\n]+/g, " ").slice(0, 200);

  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: email,
    subject: `Contatto sito: ${safeSubject}`,
    text: [
      `Nome: ${name}`,
      `Email: ${email}`,
      `Oggetto: ${subject}`,
      "",
      "Messaggio:",
      message,
    ].join("\n"),
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[contact] Resend error:", error);
    }
    return {
      ok: false,
      resetKey: prevState?.resetKey ?? 0,
      errors: {
        submission: "Invio non riuscito. Riprova tra qualche minuto.",
      },
    };
  }

  return {
    ok: true,
    resetKey: (prevState?.resetKey ?? 0) + 1,
    errors: {},
  };
}
