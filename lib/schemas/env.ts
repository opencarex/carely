import { z } from "zod";


export const appEnvSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  BETTER_AUTH_URL: z
    .url("BETTER_AUTH_URL must be a valid URL")
    .default("http://localhost:3000"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().default("Carely Hospital <no-reply@carely.local>"),
  HOSPITAL_NAME: z.string().default("Carely Hospital"),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export const seedAdminEnvSchema = appEnvSchema
  .extend({
    ADMIN_EMAIL: z.string().optional(),
    ADMIN_EMAILS: z.string().optional(),
    ADMIN_PASSWORD: z
      .string()
      .min(
        12,
        "ADMIN_PASSWORD must be at least 12 characters long with no default fallback"
      ),
  })
  .transform((data, ctx) => {
    const rawEmails = data.ADMIN_EMAIL || data.ADMIN_EMAILS;
    if (!rawEmails || !rawEmails.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "ADMIN_EMAIL (or ADMIN_EMAILS) is required",
        path: ["ADMIN_EMAIL"],
      });
      return { ...data, adminEmails: [] as string[] };
    }

    const emails = rawEmails
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const invalid = emails.filter((e) => !z.email().safeParse(e).success);
    if (invalid.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid email address(es): ${invalid.join(", ")}`,
        path: ["ADMIN_EMAIL"],
      });
      return { ...data, adminEmails: [] as string[] };
    }

    return {
      ...data,
      adminEmails: [...new Set(emails)],
    };
  });

export type SeedAdminEnv = z.infer<typeof seedAdminEnvSchema>;
