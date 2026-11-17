import { assertActiveActor, type Actor } from "@/lib/services/access-policy";
import { recordAudit } from "@/lib/services/audit";
import { staffActions } from "@/lib/audit/actions/staff";
import { randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { asc, count, desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { account, session, user } from "@/lib/db/schema/auth";
import { doctor } from "@/lib/db/schema/doctor";
import { specialty } from "@/lib/db/schema/specialty";
import {
  updateStaffDetailsSchema,
  type UpdateStaffDetailsInput,
} from "@/lib/schemas/staff";
import type { CreateStaffInput, StaffListItem, StaffRole } from "@/lib/schemas/staff";

export class StaffServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "StaffServiceError";
    this.statusCode = statusCode;
  }
}

const STAFF_ROLES = ["doctor", "nurse", "pharmacist", "receptionist"] as const;

async function isStaffAccountClaimed(userId: string): Promise<boolean> {
  const [userRow] = await db
    .select({ claimedAt: user.claimedAt })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (userRow?.claimedAt) return true;

  const [sessionRow] = await db
    .select({ count: count() })
    .from(session)
    .where(eq(session.userId, userId));

  return Number(sessionRow?.count || 0) > 0;
}

export async function listStaffMembers(): Promise<StaffListItem[]> {
  const staffUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      claimedAt: user.claimedAt,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(inArray(user.role, [...STAFF_ROLES]))
    .orderBy(desc(user.createdAt));

  if (staffUsers.length === 0) {
    return [];
  }

  const staffUserIds = staffUsers.map((u) => u.id);

  // Fetch doctors and linked specialties
  const doctorProfiles = await db
    .select({
      userId: doctor.userId,
      isActive: doctor.isActive,
      specialtyId: specialty.id,
      specialtyName: specialty.name,
    })
    .from(doctor)
    .leftJoin(specialty, eq(doctor.specialtyId, specialty.id))
    .where(inArray(doctor.userId, staffUserIds));

  const doctorProfileMap = new Map(doctorProfiles.map((d) => [d.userId, d]));

  // Count active sessions per staff member
  const sessionCounts = await db
    .select({
      userId: session.userId,
      count: count(),
    })
    .from(session)
    .where(inArray(session.userId, staffUserIds))
    .groupBy(session.userId);

  const sessionCountMap = new Map(sessionCounts.map((s) => [s.userId, Number(s.count)]));

  return staffUsers.map((member) => {
    const docProfile = doctorProfileMap.get(member.id);
    const sessions = sessionCountMap.get(member.id) ?? 0;
    const isDoctor = member.role === "doctor";

    const isClaimed = member.claimedAt !== null || sessions > 0;

    const active = isDoctor
      ? !member.banned && (docProfile?.isActive ?? true)
      : !member.banned;

    const department = isDoctor
      ? docProfile?.specialtyName || "General Practice"
      : member.role === "nurse"
        ? "Nursing Care"
        : member.role === "receptionist"
          ? "Front Desk"
          : member.role === "pharmacist"
            ? "Dispensary"
            : "Operations";

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role as StaffRole,
      department,
      active,
      inviteStatus: isClaimed ? "claimed" : "pending",
      specialty: docProfile?.specialtyId
        ? {
            id: docProfile.specialtyId,
            name: docProfile.specialtyName || "",
          }
        : null,
      createdAt: member.createdAt.toISOString(),
    };
  });
}

// Atomically provisions a staff user and sends the activation invitation email.
export async function createStaffMember(
  input: CreateStaffInput,
  actor: Actor
): Promise<{
  staff: StaffListItem;
  inviteSent: boolean;
  message: string;
}> {
  if (actor.role !== "admin") throw new StaffServiceError("Forbidden.", 403);
  const normalizedEmail = input.email.trim().toLowerCase();

  // Check for existing user with identical email
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    throw new StaffServiceError(
      "A user account already exists with this email address.",
      409
    );
  }

  // Validate specialty if role is doctor
  let resolvedSpecialtyName = "";
  if (input.role === "doctor") {
    if (!input.specialtyId) {
      throw new StaffServiceError("Specialty is required when creating a doctor.", 400);
    }

    const specialtyRow = await db
      .select({ id: specialty.id, name: specialty.name })
      .from(specialty)
      .where(eq(specialty.id, input.specialtyId))
      .limit(1);

    if (specialtyRow.length === 0) {
      throw new StaffServiceError("Selected medical specialty does not exist.", 400);
    }
    resolvedSpecialtyName = specialtyRow[0].name;
  }

  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();
  const rawRandomPassword = randomBytes(24).toString("base64");
  const hashedPassword = await hashPassword(rawRandomPassword);
  const now = new Date();

  // Atomic database writes
  await db.transaction(async (tx) => {
    await assertActiveActor(actor, tx);
    await tx.insert(user).values({
      id: userId,
      name: input.name,
      email: normalizedEmail,
      role: input.role,
      emailVerified: true,
      banned: false,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(account).values({
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    if (input.role === "doctor" && input.specialtyId) {
      await tx.insert(doctor).values({
        userId,
        specialtyId: input.specialtyId,
        isActive: true,
      });
    }
    await recordAudit(tx, {
      actorId: actor.userId,
      action: staffActions.created,
      targetType: "user",
      targetId: userId,
      metadata: { toRole: input.role },
    });
  });

  // Post-commit invitation email dispatch
  let inviteSent = false;
  let message = "Staff member created and invitation email dispatched.";

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: normalizedEmail,
        redirectTo: "/reset-password",
      },
    });
    inviteSent = true;
  } catch {
    console.error("Staff invite email dispatch failed.");
    message =
      "Staff account created successfully, but the invite email failed to send. Please use Resend Invite.";
  }

  const staffItem: StaffListItem = {
    id: userId,
    name: input.name,
    email: normalizedEmail,
    role: input.role,
    department:
      input.role === "doctor" ? resolvedSpecialtyName : input.department || "Operations",
    active: true,
    inviteStatus: "pending",
    specialty: input.specialtyId
      ? {
          id: input.specialtyId,
          name: resolvedSpecialtyName,
        }
      : null,
    createdAt: now.toISOString(),
  };

  return {
    staff: staffItem,
    inviteSent,
    message,
  };
}

// Resends the account claim invitation email. Blocked if the staff has already claimed the account.
export async function resendStaffInvite(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const staffRecord = await db
    .select({
      id: user.id,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (staffRecord.length === 0) {
    throw new StaffServiceError("Staff member not found.", 404);
  }

  const staff = staffRecord[0];
  if (!STAFF_ROLES.includes(staff.role as (typeof STAFF_ROLES)[number])) {
    throw new StaffServiceError("Target user is not a staff member.", 400);
  }

  // Check whether this staff member has already claimed their account
  const isClaimed = await isStaffAccountClaimed(userId);

  if (isClaimed) {
    throw new StaffServiceError(
      "This staff member has already claimed their account. Account takeover via invite resend is prohibited.",
      400
    );
  }

  await auth.api.requestPasswordReset({
    body: {
      email: staff.email,
      redirectTo: "/reset-password",
    },
  });

  return {
    success: true,
    message: "Invitation email resent successfully.",
  };
}

// Status changes preserve authorship and revoke existing sessions atomically.
export async function toggleStaffStatus(
  userId: string,
  active: boolean,
  actor: Actor
): Promise<{ success: boolean; active: boolean }> {
  if (actor.role !== "admin") throw new StaffServiceError("Forbidden.", 403);
  await db.transaction(async (tx) => {
    await assertActiveActor(actor, tx);
    const [staff] = await tx
      .select({ id: user.id, role: user.role, banned: user.banned })
      .from(user)
      .where(eq(user.id, userId))
      .for("update");
    if (!staff || !STAFF_ROLES.includes(staff.role as StaffRole)) {
      throw new StaffServiceError("Staff member not found.", 404);
    }
    if (actor.userId === userId) {
      throw new StaffServiceError("You cannot deactivate your own account.", 400);
    }
    // All admin targets are rejected above, including the last active admin.
    let statusChanged = Boolean(staff.banned) !== !active;
    if (staff.role === "doctor") {
      const [profile] = await tx
        .select({ isActive: doctor.isActive })
        .from(doctor)
        .where(eq(doctor.userId, userId))
        .for("update");
      if (!profile) throw new StaffServiceError("Doctor profile is missing.", 409);
      statusChanged ||= profile.isActive !== active;
    }
    await tx
      .update(user)
      .set({ banned: !active, updatedAt: new Date() })
      .where(eq(user.id, userId));
    if (staff.role === "doctor") {
      await tx.update(doctor).set({ isActive: active }).where(eq(doctor.userId, userId));
    }
    // Also clean up sessions on a repeated deactivation request.
    if (!active) await tx.delete(session).where(eq(session.userId, userId));
    if (statusChanged) {
      await recordAudit(tx, {
        actorId: actor.userId,
        action: active ? staffActions.reactivated : staffActions.deactivated,
        targetType: "user",
        targetId: userId,
        metadata: { changedFields: ["active"] },
      });
    }
  });
  return { success: true, active };
}

// Lists all available medical specialties for doctor provisioning.
export async function listSpecialties() {
  return db
    .select({
      id: specialty.id,
      name: specialty.name,
    })
    .from(specialty)
    .orderBy(asc(specialty.name));
}

// Preserve doctor rows and historical authorship when changing roles. The doctor
// specialty endpoint remains owned by the admin-config track.
export async function updateStaffMember(
  userId: string,
  body: UpdateStaffDetailsInput,
  actor: Actor
): Promise<{ success: true }> {
  if (actor.role !== "admin") throw new StaffServiceError("Forbidden.", 403);
  const input = updateStaffDetailsSchema.parse(body);
  await db.transaction(async (tx) => {
    await assertActiveActor(actor, tx);
    const [staff] = await tx.select().from(user).where(eq(user.id, userId)).for("update");
    if (!staff || !STAFF_ROLES.includes(staff.role as StaffRole)) {
      throw new StaffServiceError("Staff member not found.", 404);
    }
    const roleChanged = input.role !== undefined && input.role !== staff.role;
    const nameChanged = input.name !== undefined && input.name !== staff.name;
    if (input.specialtyId && !(roleChanged && input.role === "doctor")) {
      throw new StaffServiceError(
        "A specialty is only accepted when changing to doctor.",
        400
      );
    }
    if (!roleChanged && !nameChanged) return;
    if (roleChanged && (staff.role === "doctor" || input.role === "doctor")) {
      const [profile] = await tx
        .select()
        .from(doctor)
        .where(eq(doctor.userId, userId))
        .for("update");
      if (input.role === "doctor") {
        if (profile) {
          if (input.specialtyId && input.specialtyId !== profile.specialtyId) {
            throw new StaffServiceError(
              "Change an existing doctor's specialty through doctor configuration.",
              409
            );
          }
          await tx
            .update(doctor)
            .set({ isActive: !staff.banned })
            .where(eq(doctor.id, profile.id));
        } else {
          if (!input.specialtyId)
            throw new StaffServiceError("A specialty is required for a new doctor.", 400);
          const [selected] = await tx
            .select({ id: specialty.id })
            .from(specialty)
            .where(eq(specialty.id, input.specialtyId))
            .limit(1);
          if (!selected)
            throw new StaffServiceError(
              "Selected medical specialty does not exist.",
              400
            );
          await tx
            .insert(doctor)
            .values({ userId, specialtyId: input.specialtyId, isActive: !staff.banned });
        }
      } else if (profile) {
        await tx.update(doctor).set({ isActive: false }).where(eq(doctor.id, profile.id));
      }
    }
    await tx
      .update(user)
      .set({
        ...(nameChanged ? { name: input.name } : {}),
        ...(roleChanged ? { role: input.role } : {}),
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
    if (nameChanged) {
      await recordAudit(tx, {
        actorId: actor.userId,
        action: staffActions.updated,
        targetType: "user",
        targetId: userId,
        metadata: { changedFields: ["name"] },
      });
    }
    if (roleChanged) {
      await tx.delete(session).where(eq(session.userId, userId));
      await recordAudit(tx, {
        actorId: actor.userId,
        action: staffActions.roleChanged,
        targetType: "user",
        targetId: userId,
        metadata: {
          changedFields: ["role"],
          fromRole: staff.role as StaffRole,
          toRole: input.role,
        },
      });
    }
  });
  return { success: true };
}
