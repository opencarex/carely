import { describe, expect, it } from "vitest";
import { createStaffSchema, staffRoleEnum } from "@/lib/schemas/staff";

describe("Staff Roles Schema", () => {
  it("accepts valid staff roles", () => {
    const validRoles = ["doctor", "nurse", "pharmacist", "receptionist"];
    for (const role of validRoles) {
      const result = staffRoleEnum.safeParse(role);
      expect(result.success).toBe(true);
    }
  });

  it("rejects non-staff or invalid roles", () => {
    const invalidRoles = ["admin", "patient", "superadmin", "", "janitor"];
    for (const role of invalidRoles) {
      const result = staffRoleEnum.safeParse(role);
      expect(result.success).toBe(false);
    }
  });
});

describe("Create Staff Form Schema Validation", () => {
  const validUUID = "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d";

  it("validates a doctor with required specialty", () => {
    const input = {
      name: "Dr. Gregory House",
      email: "house@princetonplainsboro.com",
      role: "doctor",
      specialtyId: validUUID,
      department: "Diagnostics",
    };

    const result = createStaffSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("fails validation when a doctor has no specialty assigned", () => {
    const input = {
      name: "Dr. Gregory House",
      email: "house@princetonplainsboro.com",
      role: "doctor",
      department: "Diagnostics",
    };

    const result = createStaffSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("specialtyId"));
      expect(issue).toBeDefined();
      expect(issue?.message).toBe("Medical specialty is required when adding a doctor");
    }
  });

  it("fails validation when a doctor has an invalid specialty UUID", () => {
    const input = {
      name: "Dr. Gregory House",
      email: "house@princetonplainsboro.com",
      role: "doctor",
      specialtyId: "not-a-uuid",
    };

    const result = createStaffSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("validates a nurse with department", () => {
    const input = {
      name: "Nurse Jackie Peyton",
      email: "jackie@all-saints.org",
      role: "nurse",
      department: "Emergency Care",
    };

    const result = createStaffSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("fails validation when a nurse is missing a department", () => {
    const input = {
      name: "Nurse Jackie Peyton",
      email: "jackie@all-saints.org",
      role: "nurse",
    };

    const result = createStaffSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("department"));
      expect(issue).toBeDefined();
      expect(issue?.message).toBe("Department is required");
    }
  });

  it("validates a receptionist with department", () => {
    const input = {
      name: "Pam Beesly",
      email: "pam@hospital.org",
      role: "receptionist",
      department: "Front Desk",
    };

    const result = createStaffSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates a pharmacist with department", () => {
    const input = {
      name: "Walter White",
      email: "walter@pharmacy.org",
      role: "pharmacist",
      department: "Dispensary",
    };

    const result = createStaffSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email formats", () => {
    const input = {
      name: "John Doe",
      email: "not-an-email",
      role: "nurse",
      department: "General Ward",
    };

    const result = createStaffSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects names shorter than 2 characters", () => {
    const input = {
      name: "J",
      email: "john@carely.local",
      role: "nurse",
      department: "General Ward",
    };

    const result = createStaffSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
