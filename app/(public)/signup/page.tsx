import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

import { appContent } from "@/lib/config/content";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthShell
      artwork={{
        alt: `${appContent.brand.name} assistant with a patient profile`,
        height: 120,
        src: "/images/patient-profile.svg",
        width: 104,
      }}
    >
      <AuthCard
        title="Create your account"
        description="Register with the same details used by the hospital to identify your patient record."
      >
        <SignupForm
          defaultValues={{ name: "", email: "", password: "", confirmPassword: "" }}
        />
      </AuthCard>
    </AuthShell>
  );
}
