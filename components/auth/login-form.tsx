"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient } from "@/lib/auth-client";
import { getDefaultRouteForRole } from "@/lib/config/navigation";
import { mockCredentials } from "@/lib/mock/auth";
import type { LoginInput } from "@/lib/schemas/auth";
import { loginSchema } from "@/lib/schemas/auth";

function getSafeRedirectUrl(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const searchParams = new URLSearchParams(window.location.search);
  const callbackUrl = searchParams.get("callbackUrl");
  if (
    callbackUrl &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//") &&
    !callbackUrl.startsWith("/api") &&
    callbackUrl !== "/login" &&
    callbackUrl !== "/signup"
  ) {
    return callbackUrl === "/patient/dashboard" ? "/patient" : callbackUrl;
  }
  return fallback;
}

function LoginForm({ defaultValues }: { defaultValues: LoginInput }) {
  const router = useRouter();
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    defaultValues,
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginInput) => {
    setLoginError("");

    // 1. Check if input matches prototype mock staff credentials
    if (
      values.email === mockCredentials.doctor.email &&
      values.password === mockCredentials.doctor.password
    ) {
      router.push(getSafeRedirectUrl("/doctor"));
      return;
    }
    if (
      values.email === mockCredentials.nurse.email &&
      values.password === mockCredentials.nurse.password
    ) {
      router.push(getSafeRedirectUrl("/nurse/vitals"));
      return;
    }
    if (
      values.email === mockCredentials.receptionist.email &&
      values.password === mockCredentials.receptionist.password
    ) {
      router.push(getSafeRedirectUrl("/reception/register"));
      return;
    }
    if (
      values.email === mockCredentials.pharmacist.email &&
      values.password === mockCredentials.pharmacist.password
    ) {
      router.push(getSafeRedirectUrl("/pharmacy"));
      return;
    }
    if (
      values.email === mockCredentials.admin.email &&
      values.password === mockCredentials.admin.password
    ) {
      router.push(getSafeRedirectUrl("/admin"));
      return;
    }

    // 2. Real patient/staff sign-in via Better Auth
    try {
      const { data, error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setLoginError(error.message || "Invalid email or password.");
        return;
      }

      if (data) {
        const userRole = (data.user as { role?: string })?.role;
        const defaultDestination = getDefaultRouteForRole(userRole);
        const destination = getSafeRedirectUrl(defaultDestination);
        router.push(destination);
        router.refresh();
        return;
      }
    } catch {
      setLoginError("An unexpected error occurred during sign in. Please try again.");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        id="email"
        label="Email address"
        showLabel
        placeholder="Enter your email address"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        id="password"
        label="Password"
        showLabel
        placeholder="Enter your password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        error={errors.password?.message}
        endAdornment={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
        {...register("password")}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
        <label className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 select-none">
          <Controller
            name="rememberMe"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="rememberMe"
                name={field.name}
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
              />
            )}
          />
          <span>Keep me signed in</span>
        </label>
        <Link
          className="text-primary hover:text-carely-primary-deep font-semibold transition-colors hover:underline"
          href="/forgot-password"
        >
          Forgot password?
        </Link>
      </div>

      <Button fullWidth type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      {loginError ? (
        <p role="alert" className="text-destructive text-center text-sm font-medium">
          {loginError}
        </p>
      ) : null}

      <p className="text-primary text-xs font-semibold">
        Don&apos;t have an account?{" "}
        <Link className="hover:underline" href="/signup">
          Create account
        </Link>
      </p>
    </form>
  );
}

export { LoginForm };
