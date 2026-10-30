import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { appContent } from "@/lib/mock/content";

export const metadata: Metadata = {
  title: "Set Password - Carely",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      compactOnMobile
      artwork={{
        alt: `${appContent.brand.name} hospital assistant welcoming staff`,
        height: 161,
        src: "/images/welcome-home.svg",
        width: 126,
      }}
    >
      <AuthCard
        title="Activate Your Account"
        description="Choose a secure password to complete your staff account setup."
      >
        <Suspense
          fallback={
            <div className="py-6 text-center text-xs text-slate-500">
              Loading security context...
            </div>
          }
        >
          <SetPasswordForm />
        </Suspense>
      </AuthCard>
    </AuthShell>
  );
}
