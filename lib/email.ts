import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
// Address shown in the From header; falls back to the authenticating mailbox.
const SMTP_FROM = process.env.SMTP_FROM ?? (SMTP_USER ? `Builder's Tarot <${SMTP_USER}>` : undefined);

export function isEmailConfigured() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

let transporter: Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!isEmailConfigured()) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    // Port 465 uses implicit TLS (SSL); other ports negotiate STARTTLS.
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  return transporter;
}

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Sends a transactional email through the configured SMTP server.
 *
 * When SMTP is not configured (e.g. local dev), the message is logged to the
 * server console instead so flows remain testable. Credentials are never logged.
 */
export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  if (!isEmailConfigured()) {
    console.warn(
      `[email] SMTP not configured — skipping send. Would deliver "${subject}" to ${to}.`,
    );
    console.warn(`[email] Message body:\n${text}`);
    return { delivered: false as const };
  }

  await getTransporter().sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });

  return { delivered: true as const };
}
