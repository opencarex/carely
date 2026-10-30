import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP } from "better-auth/plugins";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { account, session, user, verification } from "@/lib/db/schema/auth";
import { env } from "@/lib/env";
import {
  sendPatientVerificationOTP,
  sendPasswordResetOTP,
  sendStaffInviteEmail,
} from "@/lib/mail";

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
    async sendResetPassword({ user, token }) {
      const userRole = (user as { role?: string })?.role;
      const [sessionRow] = await db
        .select({ count: count() })
        .from(session)
        .where(eq(session.userId, user.id));
      const sessionCount = Number(sessionRow?.count || 0);

      const [accountRow] = await db
        .select({ createdAt: account.createdAt, updatedAt: account.updatedAt })
        .from(account)
        .where(eq(account.userId, user.id))
        .limit(1);

      const isClaimed =
        sessionCount > 0 ||
        (accountRow ? accountRow.updatedAt.getTime() > accountRow.createdAt.getTime() : false);

      const directClaimUrl = `${env.BETTER_AUTH_URL}/reset-password?token=${token}`;

      if (!isClaimed && userRole !== "patient") {
        await sendStaffInviteEmail({
          to: user.email,
          name: user.name,
          role: userRole || "Staff",
          claimUrl: directClaimUrl,
          expiryHours: 24,
        });
      }
    },
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
