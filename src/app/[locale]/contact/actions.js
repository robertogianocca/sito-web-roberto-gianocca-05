"use server";

import { Resend } from "resend";
import { getTranslations } from "next-intl/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(value) {
  return String(value ?? "").trim();
}

async function validateContact({ name, email, subject, message }, t) {
  const errors = {};

  if (name.length < 2) {
    errors.name = t("nameTooShort");
  } else if (name.length > 100) {
    errors.name = t("nameTooLong");
  }

  if (!email) {
    errors.email = t("emailRequired");
  } else if (email.length > 254) {
    errors.email = t("emailTooLong");
  } else if (!EMAIL_RE.test(email)) {
    errors.email = t("emailInvalid");
  }

  if (subject.length < 3) {
    errors.subject = t("subjectTooShort");
  } else if (subject.length > 200) {
    errors.subject = t("subjectTooLong");
  }

  if (message.length < 10) {
    errors.message = t("messageTooShort");
  } else if (message.length > 5000) {
    errors.message = t("messageTooLong");
  }

  return errors;
}

/**
 * Sends the contact form via Resend.
 * Env: RESEND_API_KEY, RESEND_FROM_EMAIL, CONTACT_TO_EMAIL (see docs/contact-form-resend.md).
 */
export async function submitContactAction(prevState, formData) {
  const t = await getTranslations("ContactForm.errors");

  const website = field(formData.get("website"));
  if (website) {
    return { ok: true, resetKey: (prevState?.resetKey ?? 0) + 1, errors: {} };
  }

  const name = field(formData.get("name"));
  const email = field(formData.get("email"));
  const subject = field(formData.get("subject"));
  const message = field(formData.get("message"));

  const fieldErrors = await validateContact({ name, email, subject, message }, t);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, resetKey: prevState?.resetKey ?? 0, errors: fieldErrors };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const to = process.env.CONTACT_TO_EMAIL?.trim();

  if (!apiKey || !from || !to) {
    if (process.env.NODE_ENV === "development") {
      console.error("[contact] Missing RESEND_API_KEY, RESEND_FROM_EMAIL, or CONTACT_TO_EMAIL");
    }
    return {
      ok: false,
      resetKey: prevState?.resetKey ?? 0,
      errors: { submission: t("serviceUnconfigured") },
    };
  }

  const resend = new Resend(apiKey);
  const safeSubject = subject.replace(/[\r\n]+/g, " ").slice(0, 200);

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `Contact: ${safeSubject}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
        "",
        "Message:",
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
        errors: { submission: t("sendFailed") },
      };
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[contact] Resend threw:", err);
    }
    return {
      ok: false,
      resetKey: prevState?.resetKey ?? 0,
      errors: { submission: t("sendFailed") },
    };
  }

  return {
    ok: true,
    resetKey: (prevState?.resetKey ?? 0) + 1,
    errors: {},
  };
}
