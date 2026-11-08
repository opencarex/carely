import { describe, expect, it } from "vitest";
import { auditEventSchema } from "@/lib/schemas/audit";
import {
  checkInAppointmentSchema,
  isAllowedQueueTransition,
  transitionQueueEntrySchema,
} from "@/lib/schemas/queue";
import { updateStaffStatusSchema } from "@/lib/schemas/staff";
import { disabledAuthAdminPaths, isBlockedAuthAdminPath } from "@/lib/auth-admin-policy";

describe("Foundation contracts", () => {
  it("accepts structural audit metadata and rejects patient values and unknown fields", () => {
    const event = {
      actorId: "actor",
      action: "patient.updated",
      targetType: "patient",
      targetId: "id",
    };
    expect(
      auditEventSchema.safeParse({ ...event, metadata: { changedFields: ["phone"] } })
        .success
    ).toBe(true);
    for (const metadata of [
      { phone: "0771234567" },
      { changedFields: ["Alice Smith"] },
      { content: "private note" },
    ]) {
      expect(auditEventSchema.safeParse({ ...event, metadata }).success).toBe(false);
    }
    expect(auditEventSchema.safeParse({ ...event, patientName: "private" }).success).toBe(
      false
    );
  });
  it("allows only the next queue state for the correct clinical role", () => {
    expect(isAllowedQueueTransition("waiting", "intake_done", "nurse")).toBe(true);
    expect(isAllowedQueueTransition("intake_done", "with_doctor", "doctor")).toBe(true);
    expect(isAllowedQueueTransition("with_doctor", "completed", "doctor")).toBe(true);
    expect(isAllowedQueueTransition("waiting", "completed", "doctor")).toBe(false);
    expect(isAllowedQueueTransition("intake_done", "waiting", "nurse")).toBe(false);
    expect(isAllowedQueueTransition("waiting", "intake_done", "receptionist")).toBe(
      false
    );
    expect(isAllowedQueueTransition("with_doctor", "completed", "admin")).toBe(false);
  });
  it("rejects actor injection and extra fields in queue and status bodies", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(
      checkInAppointmentSchema.safeParse({ appointmentId: id, actor: { role: "admin" } })
        .success
    ).toBe(false);
    expect(
      transitionQueueEntrySchema.safeParse({
        entryId: id,
        from: "waiting",
        to: "unknown",
      }).success
    ).toBe(false);
    expect(
      updateStaffStatusSchema.safeParse({ active: false, role: "admin" }).success
    ).toBe(false);
  });
  it("blocks the entire auth admin namespace including encoded and repeated separators", () => {
    for (const path of [
      "/api/auth/admin",
      "/api/auth/admin/remove-user",
      "/api/auth/%61dmin/set-role",
      "/api/auth//admin/create-user",
    ]) {
      expect(isBlockedAuthAdminPath("http://localhost" + path)).toBe(true);
    }
    expect(isBlockedAuthAdminPath("http://localhost/api/auth/get-session")).toBe(false);
    expect(
      isBlockedAuthAdminPath("http://localhost/api/auth/request-password-reset")
    ).toBe(false);
    expect(disabledAuthAdminPaths).toContain("/admin/set-user-password");
  });
});
