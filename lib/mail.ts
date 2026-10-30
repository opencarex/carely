import fs from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { hospitalSettings } from "@/lib/db/schema/settings";
import { env } from "@/lib/env";

export const mailer = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  ...(env.SMTP_USER && env.SMTP_PASS
    ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
    : {}),
});

let cachedOtpHtmlTemplate: string | null = null;
let cachedOtpTxtTemplate: string | null = null;

async function getOtpEmailTemplates() {
  if (
    process.env.NODE_ENV === "production" &&
    cachedOtpHtmlTemplate &&
    cachedOtpTxtTemplate
  ) {
    return { html: cachedOtpHtmlTemplate, txt: cachedOtpTxtTemplate };
  }

  const htmlPath = path.join(process.cwd(), "templates", "emails", "verify-otp.html");
  const txtPath = path.join(process.cwd(), "templates", "emails", "verify-otp.txt");

  const [html, txt] = await Promise.all([
    fs.readFile(htmlPath, "utf-8"),
    fs.readFile(txtPath, "utf-8"),
  ]);

  if (process.env.NODE_ENV === "production") {
    cachedOtpHtmlTemplate = html;
    cachedOtpTxtTemplate = txt;
  }

  return { html, txt };
}

let cachedResetOtpHtmlTemplate: string | null = null;
let cachedResetOtpTxtTemplate: string | null = null;

async function getResetPasswordOtpEmailTemplates() {
  if (
    process.env.NODE_ENV === "production" &&
    cachedResetOtpHtmlTemplate &&
    cachedResetOtpTxtTemplate
  ) {
    return { html: cachedResetOtpHtmlTemplate, txt: cachedResetOtpTxtTemplate };
  }

  const htmlPath = path.join(
    process.cwd(),
    "templates",
    "emails",
    "reset-password-otp.html"
  );
  const txtPath = path.join(
    process.cwd(),
    "templates",
    "emails",
    "reset-password-otp.txt"
  );

  const [html, txt] = await Promise.all([
    fs.readFile(htmlPath, "utf-8"),
    fs.readFile(txtPath, "utf-8"),
  ]);

  if (process.env.NODE_ENV === "production") {
    cachedResetOtpHtmlTemplate = html;
    cachedResetOtpTxtTemplate = txt;
  }

  return { html, txt };
}

let cachedStaffInviteHtmlTemplate: string | null = null;
let cachedStaffInviteTxtTemplate: string | null = null;

async function getStaffInviteEmailTemplates() {
  if (
    process.env.NODE_ENV === "production" &&
    cachedStaffInviteHtmlTemplate &&
    cachedStaffInviteTxtTemplate
  ) {
    return { html: cachedStaffInviteHtmlTemplate, txt: cachedStaffInviteTxtTemplate };
  }

  const htmlPath = path.join(process.cwd(), "templates", "emails", "staff-invite.html");
  const txtPath = path.join(process.cwd(), "templates", "emails", "staff-invite.txt");

  const [html, txt] = await Promise.all([
    fs.readFile(htmlPath, "utf-8"),
    fs.readFile(txtPath, "utf-8"),
  ]);

  if (process.env.NODE_ENV === "production") {
    cachedStaffInviteHtmlTemplate = html;
    cachedStaffInviteTxtTemplate = txt;
  }

  return { html, txt };
}

export async function getHospitalName(): Promise<string> {
  const fallback = env.HOSPITAL_NAME || "Carely Hospital";
  try {
    const settings = await db
      .select({ name: hospitalSettings.hospitalName })
      .from(hospitalSettings)
      .where(eq(hospitalSettings.id, 1))
      .limit(1);

    return settings[0]?.name || fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderTemplate(
  template: string,
  tokens: Record<string, string>,
  escapeFn?: (val: string) => string
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (key in tokens) {
      return escapeFn ? escapeFn(tokens[key]) : tokens[key];
    }
    return match;
  });
}

export interface SendVerificationOTPParams {
  to: string;
  otp: string;
  expiryMinutes?: number;
}

export async function sendPatientVerificationOTP({
  to,
  otp,
  expiryMinutes = 10,
}: SendVerificationOTPParams) {
  const hospitalName = await getHospitalName();
  const { html, txt } = await getOtpEmailTemplates();

  const tokens: Record<string, string> = {
    hospital_name: hospitalName,
    otp_code: otp,
    expiry_minutes: String(expiryMinutes),
  };

  const emailFrom = env.SMTP_FROM || `"${hospitalName}" <no-reply@carely.local>`;

  return mailer.sendMail({
    from: emailFrom,
    to,
    subject: `Your ${hospitalName} verification code`,
    text: renderTemplate(txt, tokens),
    html: renderTemplate(html, tokens, escapeHtml),
  });
}

export async function sendPasswordResetOTP({
  to,
  otp,
  expiryMinutes = 10,
}: SendVerificationOTPParams) {
  const hospitalName = await getHospitalName();
  const { html, txt } = await getResetPasswordOtpEmailTemplates();

  const tokens: Record<string, string> = {
    hospital_name: hospitalName,
    otp_code: otp,
    expiry_minutes: String(expiryMinutes),
  };

  const emailFrom = env.SMTP_FROM || `"${hospitalName}" <no-reply@carely.local>`;

  return mailer.sendMail({
    from: emailFrom,
    to,
    subject: `Reset your ${hospitalName} password`,
    text: renderTemplate(txt, tokens),
    html: renderTemplate(html, tokens, escapeHtml),
  });
}


export interface SendStaffInviteParams {
  to: string;
  name: string;
  role: string;
  claimUrl: string;
  expiryHours?: number;
}

export async function sendStaffInviteEmail({
  to,
  name,
  role,
  claimUrl,
  expiryHours = 24,
}: SendStaffInviteParams) {
  const hospitalName = await getHospitalName();
  const { html, txt } = await getStaffInviteEmailTemplates();

  const tokens: Record<string, string> = {
    hospital_name: hospitalName,
    staff_name: name,
    staff_role: role,
    claim_url: claimUrl,
    expiry_hours: String(expiryHours),
  };

  const emailFrom = env.SMTP_FROM || `"${hospitalName}" <no-reply@carely.local>`;

  return mailer.sendMail({
    from: emailFrom,
    to,
    subject: `Invitation: Set up your ${hospitalName} staff account`,
    text: renderTemplate(txt, tokens),
    html: renderTemplate(html, tokens, escapeHtml),
  });
}
