import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

import { appContent } from "@/lib/config/content";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell
      compactOnMobile
      artwork={{
        alt: `${appContent.brand.name} assistant welcoming a patient`,
        height: 161,
        src: "/images/welcome-home.svg",
        width: 126,
      }}
    >
      <AuthCard
        title="Welcome back"
        description="Sign in to view your appointments, queue position, and prescriptions."
      >
        <LoginForm defaultValues={{ email: "", password: "", rememberMe: false }} />
      </AuthCard>
    </AuthShell>
  );
}
