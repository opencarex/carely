import { disabledAuthAdminPaths } from "@/lib/auth-admin-policy";
import { betterAuth } from "better-auth";
import { admin, emailOTP } from "better-auth/plugins";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { session, user } from "@/lib/db/schema/auth";
import { auditedAuthAdapter, authAuditHooks } from "@/lib/services/auth-audit";
import { env } from "@/lib/env";
import {
  sendPatientVerificationOTP,
  sendPasswordResetOTP,
  sendStaffInviteEmail,
} from "@/lib/mail";

async function isAccountClaimed(userId: string): Promise<boolean> {
  const [userRow] = await db
    .select({ claimedAt: user.claimedAt })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (userRow?.claimedAt) return true;

  const [sessionRow] = await db
    .select({ count: count() })
    .from(session)
    .where(eq(session.userId, userId));

  return Number(sessionRow?.count || 0) > 0;
}

export const auth = betterAuth({
  disabledPaths: disabledAuthAdminPaths,
  database: auditedAuthAdapter,
  hooks: authAuditHooks,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 86400, // 24 hours globally
    async onPasswordReset({ user: resetUser }) {
      await db
        .update(user)
        .set({ claimedAt: new Date(), updatedAt: new Date() })
        .where(eq(user.id, resetUser.id));
    },
    async sendResetPassword({ user, token }) {
      const userRole = (user as { role?: string })?.role;
      const isClaimed = await isAccountClaimed(user.id);
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
