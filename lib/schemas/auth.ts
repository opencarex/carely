import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean(),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Full name must be at least 2 characters"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const resetPasswordOtpSchema = z
  .object({
    otp: z.string().length(6, "Enter the 6-digit code"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const patientOnboardingSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  phone: z.string().trim().min(7, "Enter a valid telephone number"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date (YYYY-MM-DD)")
    .refine((val) => {
      const parts = val.split("-").map(Number);
      if (parts.length !== 3) return false;
      const [year, month, day] = parts;
      const date = new Date(Date.UTC(year, month - 1, day));
      const now = new Date();

      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day &&
        date.getTime() <= now.getTime()
      );
    }, "Date of birth must be a valid calendar date in the past"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    error: "Select a valid gender",
  }),
  address: z.string().trim().optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
export type ResetPasswordOtpInput = z.infer<typeof resetPasswordOtpSchema>;
export type PatientOnboardingInput = z.infer<typeof patientOnboardingSchema>;

export const roleSchema = z.enum([
  "patient",
  "doctor",
  "nurse",
  "receptionist",
  "pharmacist",
  "admin",
]);

export const mockCredentialSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: roleSchema,
});

export type MockCredential = z.infer<typeof mockCredentialSchema>;
