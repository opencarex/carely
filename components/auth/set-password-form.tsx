"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { newPasswordSchema, type NewPasswordInput } from "@/lib/schemas/auth";

export function SetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordInput>({
    defaultValues: { password: "", confirmPassword: "" },
    resolver: zodResolver(newPasswordSchema),
  });

  const onSubmit = async (values: NewPasswordInput) => {
    setServerError(null);

    if (!token) {
      setServerError("Activation token is missing. Please check your invitation email.");
      return;
    }

    try {
      const { error } = await authClient.resetPassword({
        newPassword: values.password,
        token,
      });

      if (error) {
        setServerError(
          error.message ||
            "Unable to activate account. The invitation link may have expired."
        );
        return;
      }

      setIsSuccess(true);
    } catch {
      setServerError("An unexpected error occurred. Please try again later.");
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900">
            Account Activated Successfully
          </h3>
          <p className="text-xs text-slate-500">
            Your password has been saved. You can now sign in with your hospital email.
          </p>
        </div>
        <Link
          href="/login"
          className={buttonVariants({
            fullWidth: true,
            className: "mt-2",
          })}
        >
          Proceed to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
        >
          {serverError}
        </div>
      )}

      {!token && (
        <div
          role="alert"
          className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
        >
          Warning: No activation token detected in URL. Please click the link directly from your invitation email.
        </div>
      )}

      <div className="space-y-1.5">
        <Input
          id="password"
          label="New Password"
          showLabel
          type={showPassword ? "text" : "password"}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          disabled={isSubmitting}
          error={errors.password?.message}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          {...register("password")}
        />
      </div>

      <div className="space-y-1.5">
        <Input
          id="confirmPassword"
          label="Confirm New Password"
          showLabel
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          disabled={isSubmitting}
          error={errors.confirmPassword?.message}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          {...register("confirmPassword")}
        />
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={isSubmitting || !token}
        className="mt-2"
      >
        <KeyRound className="mr-2 h-4 w-4" />
        {isSubmitting ? "Setting Password..." : "Activate Account & Set Password"}
      </Button>

      <div className="text-center text-xs">
        <Link
          href="/login"
          className="text-slate-600 hover:text-slate-900 underline"
        >
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
