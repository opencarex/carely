import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { appContent } from "@/lib/mock/content";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      artwork={{
        alt: `${appContent.brand.name} assistant welcoming a patient`,
        height: 161,
        src: "/images/welcome-home.svg",
        width: 126,
      }}
    >
      <AuthCard
        title="Reset your password"
        description="Enter your verified email address. We will send a 6-digit verification code to reset your password."
      >
        <PasswordResetForm />
      </AuthCard>
    </AuthShell>
  );
}
