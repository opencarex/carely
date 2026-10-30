import { describe, expect, it } from "vitest";
import { loginSchema, newPasswordSchema } from "@/lib/schemas/auth";

describe("New Password / Claim Password Schema", () => {
  it("accepts matching passwords with at least 8 characters", () => {
    const input = {
      password: "StrongPassword123!",
      confirmPassword: "StrongPassword123!",
    };

    const result = newPasswordSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("fails when password is fewer than 8 characters", () => {
    const input = {
      password: "short",
      confirmPassword: "short",
    };

    const result = newPasswordSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password must be at least 8 characters");
    }
  });

  it("fails when passwords do not match", () => {
    const input = {
      password: "Password123!",
      confirmPassword: "DifferentPassword123!",
    };

    const result = newPasswordSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Passwords do not match");
    }
  });
});

describe("Login Schema", () => {
  it("accepts valid email and password", () => {
    const input = {
      email: "staff@carely.local",
      password: "HospitalPassword123!",
      rememberMe: true,
    };

    const result = loginSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects malformed email", () => {
    const input = {
      email: "not-an-email",
      password: "HospitalPassword123!",
      rememberMe: false,
    };

    const result = loginSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
