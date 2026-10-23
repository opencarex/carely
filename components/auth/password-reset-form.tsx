"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, KeyRound, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ResendOtpButton } from "@/components/auth/resend-otp-button";
import { SixDigitOtpInput } from "@/components/auth/six-digit-otp-input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import {
  forgotPasswordSchema,
  newPasswordSchema,
  type ForgotPasswordInput,
  type NewPasswordInput,
} from "@/lib/schemas/auth";

const RESEND_COOLDOWN_SECONDS = 60;

type Step = "email" | "otp" | "password" | "success";

function PasswordResetForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { countdown, startCooldown } = useCooldown(RESEND_COOLDOWN_SECONDS);

  // Form for Step 1: Request OTP
  const emailForm = useForm<ForgotPasswordInput>({
    defaultValues: { email: "" },
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Form for Step 3: New Password
  const passwordForm = useForm<NewPasswordInput>({
    defaultValues: { password: "", confirmPassword: "" },
    resolver: zodResolver(newPasswordSchema),
  });

  // Step 1: Request password reset OTP
  const onRequestOtp = async (values: ForgotPasswordInput) => {
    setServerError(null);
    try {
      const { error } = await authClient.emailOtp.requestPasswordReset({
        email: values.email,
      });

      if (error) {
        setServerError(
          error.message || "Unable to send verification code. Please check your email."
        );
        return;
      }

      setEmail(values.email);
      setStep("otp");
      startCooldown();
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setOtpError(null);
    setResendSuccess(false);

    try {
      const { error } = await authClient.emailOtp.requestPasswordReset({ email });
      if (error) {
        setOtpError(error.message || "Failed to resend code.");
      } else {
        setResendSuccess(true);
        startCooldown();
        setTimeout(() => setResendSuccess(false), 4000);
      }
    } catch {
      setOtpError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify ?? otp).trim();
    if (code.length !== 6 || isVerifyingOtp) return;

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      // Validate OTP via checkVerificationOtp if available
      const { error } = await authClient.emailOtp.checkVerificationOtp({
        email,
        otp: code,
        type: "forget-password",
      });

      if (error) {
        setOtpError(error.message || "Invalid or expired verification code.");
        return;
      }

      setStep("password");
    } catch {
      setOtpError("Connection error. Please check your network and try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 3: Submit New Password
  const onResetPassword = async (values: NewPasswordInput) => {
    setServerError(null);

    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password: values.password,
      });

      if (error) {
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes("otp") || msg.includes("code") || msg.includes("expired")) {
          setStep("otp");
          setOtpError(
            error.message || "Verification code expired. Please request a new code."
          );
          return;
        }
        setServerError(error.message || "Failed to reset password. Please try again.");
        return;
      }

      setStep("success");
    } catch {
      setServerError("An unexpected error occurred while resetting password.");
    }
  };

  // Step 4: Success View
  if (step === "success") {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-foreground text-lg font-bold">Password Reset Complete</h3>
          <p className="text-muted-foreground text-sm">
            Your password has been successfully updated. You can now log in with your new
            credentials.
          </p>
        </div>
        <div className="mt-4">
          <Link
            href="/login"
            className={buttonVariants({ variant: "default", fullWidth: true })}
          >
            Sign in with new password
          </Link>
        </div>
      </div>
    );
  }

  // Step 3: Set New Password View
  if (step === "password") {
    return (
      <form
        className="space-y-4"
        onSubmit={passwordForm.handleSubmit(onResetPassword)}
        noValidate
      >
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-primary flex items-center justify-center gap-2 sm:justify-start">
            <KeyRound className="size-4" />
            <span className="text-xs font-semibold tracking-wider uppercase">
              Set New Password
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            Create a secure password of at least 8 characters for{" "}
            <span className="text-foreground font-semibold">{email}</span>.
          </p>
        </div>

        {serverError ? (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-xs font-medium">
            {serverError}
          </div>
        ) : null}

        <Input
          id="newPassword"
          label="New Password"
          placeholder="At least 8 characters"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          error={passwordForm.formState.errors.password?.message}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          {...passwordForm.register("password")}
        />

        <Input
          id="confirmPassword"
          label="Confirm New Password"
          placeholder="Re-enter your new password"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          error={passwordForm.formState.errors.confirmPassword?.message}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          {...passwordForm.register("confirmPassword")}
        />

        <Button fullWidth type="submit" disabled={passwordForm.formState.isSubmitting}>
          {passwordForm.formState.isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="size-4 animate-spin" /> Updating password…
            </span>
          ) : (
            "Save New Password"
          )}
        </Button>

        <button
          type="button"
          onClick={() => setStep("otp")}
          className="text-muted-foreground hover:text-foreground block w-full text-center text-xs font-medium"
        >
          Back to code verification
        </button>
      </form>
    );
  }

  // Step 2: OTP Verification View
  if (step === "otp") {
    return (
      <div className="space-y-4">
        <div className="bg-muted/40 text-muted-foreground rounded-lg p-3 text-center text-xs">
          <div className="text-foreground flex items-center justify-center gap-1.5 font-medium">
            <Mail className="text-primary size-3.5" />
            <span>Code sent to {email}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setOtp("");
              setOtpError(null);
            }}
            className="text-primary mt-1 font-semibold hover:underline"
          >
            Change email
          </button>
        </div>

        {resendSuccess ? (
          <div className="flex items-center justify-center gap-2 rounded-md bg-emerald-50 p-2.5 text-xs text-emerald-700">
            <CheckCircle2 className="size-4" />
            <span>New verification code sent to your email!</span>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label className="text-foreground block text-center text-xs font-semibold tracking-wider uppercase">
            6-Digit Verification Code
          </label>
          <SixDigitOtpInput
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (otpError) setOtpError(null);
            }}
            onComplete={handleVerifyOtp}
            disabled={isVerifyingOtp}
            error={otpError}
          />
        </div>

        <Button
          fullWidth
          type="button"
          onClick={() => handleVerifyOtp()}
          disabled={otp.length !== 6 || isVerifyingOtp}
        >
          {isVerifyingOtp ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="size-4 animate-spin" /> Verifying…
            </span>
          ) : (
            "Continue"
          )}
        </Button>

        <div className="flex items-center justify-center pt-1 text-xs">
          <ResendOtpButton
            countdown={countdown}
            isResending={isResending}
            onResend={handleResendOtp}
          />
        </div>

        <Link
          className="text-primary block text-center text-xs font-semibold hover:underline"
          href="/login"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  // Step 1: Request OTP View
  return (
    <form
      className="space-y-4"
      onSubmit={emailForm.handleSubmit(onRequestOtp)}
      noValidate
    >
      <Input
        id="resetEmail"
        label="Email address"
        placeholder="Enter your registered email address"
        type="email"
        autoComplete="email"
        error={emailForm.formState.errors.email?.message}
        {...emailForm.register("email")}
      />

      {serverError ? (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-xs font-medium">
          {serverError}
        </div>
      ) : null}

      <Button fullWidth type="submit" disabled={emailForm.formState.isSubmitting}>
        {emailForm.formState.isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <RefreshCw className="size-4 animate-spin" /> Sending code…
          </span>
        ) : (
          "Send verification code"
        )}
      </Button>

      <Link
        className="text-primary block text-center text-xs font-semibold hover:underline"
        href="/login"
      >
        Back to sign in
      </Link>
    </form>
  );
}

export { PasswordResetForm };
