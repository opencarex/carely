import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP } from "better-auth/plugins";
import { db } from "@/lib/db";
import { account, session, user, verification } from "@/lib/db/schema/auth";
import { env } from "@/lib/env";
import { sendPatientVerificationOTP, sendPasswordResetOTP } from "@/lib/mail";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 86400, // 24 hours globally
  },
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "patient",
        input: false,
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "patient",
      adminRoles: ["admin"],
    }),
    emailOTP({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      expiresIn: 600,
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "email-verification") {
          await sendPatientVerificationOTP({
            to: email,
            otp,
            expiryMinutes: 10,
          });
        } else if (type === "forget-password") {
          await sendPasswordResetOTP({
            to: email,
            otp,
            expiryMinutes: 10,
          });
        }
      },
    }),
  ],
});
