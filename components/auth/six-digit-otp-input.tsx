"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

interface SixDigitOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: string | null;
  className?: string;
}

export function SixDigitOtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus = true,
  error,
  className,
}: SixDigitOtpInputProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-center py-1">
        <InputOTP
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={value}
          onChange={(val) => {
            onChange(val);
            if (val.length === 6 && onComplete) {
              onComplete(val);
            }
          }}
          disabled={disabled}
          autoFocus={autoFocus}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-center text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
