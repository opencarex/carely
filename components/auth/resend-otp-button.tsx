"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResendOtpButtonProps {
  countdown: number;
  isResending: boolean;
  onResend: () => void | Promise<void>;
  className?: string;
}

export function ResendOtpButton({
  countdown,
  isResending,
  onResend,
  className,
}: ResendOtpButtonProps) {
  const isCoolingDown = countdown > 0;

  return (
    <button
      type="button"
      onClick={onResend}
      disabled={isCoolingDown || isResending}
      className={cn(
        "text-primary hover:text-carely-primary-deep text-xs font-semibold transition-colors disabled:cursor-not-allowed",
        className
      )}
    >
      {isResending ? (
        <span className="flex items-center gap-1.5">
          <RefreshCw className="size-3 animate-spin" /> Sending…
        </span>
      ) : isCoolingDown ? (
        `Resend in ${countdown}s`
      ) : (
        "Didn't receive code? Resend"
      )}
    </button>
  );
}
