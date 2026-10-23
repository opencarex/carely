"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, CheckCircle2, Eye, EyeOff, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ResendOtpButton } from "@/components/auth/resend-otp-button";
import { SixDigitOtpInput } from "@/components/auth/six-digit-otp-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { INLINE_ICON_SIZE } from "@/lib/constants/ui";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import type { SignupInput } from "@/lib/schemas/auth";
import { signupSchema } from "@/lib/schemas/auth";

const RESEND_COOLDOWN_SECONDS = 60;

function SignupForm({ defaultValues }: { defaultValues: SignupInput }) {
  const router = useRouter();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { countdown: cooldown, startCooldown } = useCooldown(RESEND_COOLDOWN_SECONDS);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    defaultValues,
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: SignupInput) => {
    setServerError(null);
    try {
      const { error } = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
      });

      if (error) {
        setServerError(error.message || "Failed to create account. Please try again.");
        return;
      }

      setSubmittedEmail(values.email);
      startCooldown();
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify ?? otp).trim();
    if (!/^\d{6}$/.test(code) || isVerifying || !submittedEmail) return;

    setIsVerifying(true);
    setOtpError(null);

    try {
      const { error } = await authClient.emailOtp.verifyEmail({
        email: submittedEmail,
        otp: code,
      });

      if (error) {
        setOtpError(error.message || "Invalid or expired verification code.");
        return;
      }

      router.push("/patient");
      router.refresh();
    } catch {
      setOtpError("An unexpected error occurred while verifying. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!submittedEmail || cooldown > 0 || isResending) return;
    setIsResending(true);
    setResendSuccess(false);
    setOtpError(null);

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: submittedEmail,
        type: "email-verification",
      });

      if (error) {
        setOtpError(error.message || "Failed to resend verification code.");
      } else {
        setResendSuccess(true);
        startCooldown();
      }
    } catch {
      setOtpError("Could not resend code. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  if (submittedEmail) {
    return (
      <div className="space-y-5 text-center">
        <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-full">
          <Mail className="size-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-foreground text-xl font-bold tracking-tight">
            Verify your email
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We sent a 6-digit verification code to{" "}
            <span className="text-foreground font-semibold">{submittedEmail}</span>.
          </p>
        </div>

        {otpError ? (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {otpError}
          </div>
        ) : null}

        {resendSuccess ? (
          <div className="flex items-center justify-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" />
            New verification code sent!
          </div>
        ) : null}

        <SixDigitOtpInput
          value={otp}
          onChange={(val) => {
            setOtp(val);
            if (otpError) setOtpError(null);
          }}
          onComplete={handleVerifyOtp}
          disabled={isVerifying}
        />

        <Button
          type="button"
          fullWidth
          onClick={() => handleVerifyOtp()}
          disabled={otp.length !== 6 || isVerifying}
        >
          {isVerifying ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="size-4 animate-spin" /> Verifying…
            </span>
          ) : (
            "Verify & Continue"
          )}
        </Button>

        <div className="flex items-center justify-between pt-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setSubmittedEmail(null);
              setOtp("");
              setOtpError(null);
            }}
            className="text-muted-foreground hover:text-foreground font-medium"
          >
            ← Change email
          </button>

          <ResendOtpButton
            countdown={cooldown}
            isResending={isResending}
            onResend={handleResend}
          />
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError ? (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {serverError}
        </div>
      ) : null}

      <div className="space-y-3">
        <Input
          id="name"
          label="Full name"
          placeholder="Enter your full legal name"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          id="signupEmail"
          label="Email address"
          placeholder="Enter your email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          id="signupPassword"
          label="Password"
          placeholder="Create a password (min. 8 characters)"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
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

        <Input
          id="confirmPassword"
          label="Confirm password"
          placeholder="Repeat your password"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          {...register("confirmPassword")}
        />
      </div>

      <div className="bg-carely-info flex gap-3.5 rounded-lg px-4 py-3.5">
        <div className="bg-card text-primary grid size-10 shrink-0 place-items-center rounded-full">
          <AtSign size={INLINE_ICON_SIZE} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">Verification code required</p>
          <p className="text-muted-foreground text-xs leading-relaxed font-normal">
            A 6-digit verification code will be sent to your email to verify and activate
            your patient account.
          </p>
        </div>
      </div>

      <Button fullWidth type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-primary text-center text-xs font-semibold">
        Already registered?{" "}
        <Link className="hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export { SignupForm };
