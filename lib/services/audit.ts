import { auditLog } from "@/lib/db/schema/audit-log";
import type { DbTransaction } from "@/lib/db/types";
import { auditEventSchema, type AuditEvent } from "@/lib/schemas/audit";

// No db default: the caller must supply the SAME transaction as the domain write.
export async function recordAudit(tx: DbTransaction, event: AuditEvent) {
  const input = auditEventSchema.parse(event);
  const [row] = await tx
    .insert(auditLog)
    .values({
      userId: input.actorId,
      action: input.action,
      entityType: input.targetType,
      entityId: input.targetId,
      metadata: input.metadata,
    })
    .returning();
  return row;
}
