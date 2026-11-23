import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import { DEFAULT_HOSPITAL_NAME } from "@/lib/config/content";
import { settingsActions } from "@/lib/audit/actions/settings";
import { db } from "@/lib/db";
import { hospitalSettings } from "@/lib/db/schema/settings";
import { assertActiveActor, type Actor } from "@/lib/services/access-policy";
import { recordAudit } from "@/lib/services/audit";
import { ServiceError } from "@/lib/services/service-error";
type SettingsInput = {
  hospitalName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
};

function requireAdmin(actor: Actor) {
  if (actor.role !== "admin") throw new ServiceError("Forbidden.", 403, "FORBIDDEN");
}

const fields = ["hospitalName", "address", "phone", "email"] as const;

export const getHospitalContact = cache(async () => {
  await connection();
  const [row] = await db
    .select({ name: hospitalSettings.hospitalName, phone: hospitalSettings.phone })
    .from(hospitalSettings)
    .where(eq(hospitalSettings.id, 1))
    .limit(1);
  return { name: row?.name ?? DEFAULT_HOSPITAL_NAME, phone: row?.phone ?? null };
});

export async function getSettings() {
  const [row] = await db
    .select()
    .from(hospitalSettings)
    .where(eq(hospitalSettings.id, 1))
    .limit(1);
  if (row) return row;
  const [created] = await db
    .insert(hospitalSettings)
    .values({ id: 1, hospitalName: DEFAULT_HOSPITAL_NAME })
    .onConflictDoNothing({ target: hospitalSettings.id })
    .returning();
  if (created) return created;
  const [existing] = await db
    .select()
    .from(hospitalSettings)
    .where(eq(hospitalSettings.id, 1))
    .limit(1);
  return existing;
}

export async function updateSettings(input: SettingsInput, actor: Actor) {
  requireAdmin(actor);
  return db.transaction(async (tx) => {
    await assertActiveActor(actor, tx);
    const [current] = await tx
      .select()
      .from(hospitalSettings)
      .where(eq(hospitalSettings.id, 1))
      .limit(1);
    const changedFields = fields.filter((field) => current?.[field] !== input[field]);
    const [updated] = await tx
      .insert(hospitalSettings)
      .values({ id: 1, ...input, updatedBy: actor.userId, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: hospitalSettings.id,
        set: { ...input, updatedBy: actor.userId, updatedAt: new Date() },
      })
      .returning();
    if (changedFields.length) {
      await recordAudit(tx, {
        actorId: actor.userId,
        action: settingsActions.updated,
        targetType: "hospital_settings",
        targetId: "1",
        metadata: { changedFields },
      });
    }
    return updated;
  });
}
