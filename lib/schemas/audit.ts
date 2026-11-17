import { z } from "zod";

const role = z.enum([
  "admin",
  "patient",
  "doctor",
  "nurse",
  "receptionist",
  "pharmacist",
]);
const status = z.enum([
  "waiting",
  "intake_done",
  "with_doctor",
  "completed",
  "in_progress",
  "booked",
  "cancelled",
  "issued",
  "dispensed",
]);
// Only structural metadata is accepted. Never accept free text or patient values.
export const auditMetadataSchema = z
  .object({
    changedFields: z
      .array(
        z.enum([
          "name",
          "hospitalName",
          "email",
          "form",
          "strength",
          "isActive",
          "batchNo",
          "expiryDate",
          "quantityOnHand",
          "fullName",
          "phone",
          "dateOfBirth",
          "gender",
          "address",
          "emergencyContactName",
          "emergencyContactPhone",
          "specialtyId",
          "regNo",
          "consultationFee",
          "bio",
          "active",
          "role",
          "content",
          "additional",
          "bpSystolic",
          "bpDiastolic",
          "heartRate",
          "respiratoryRate",
          "temperatureC",
          "spo2",
          "weightKg",
          "heightCm",
          "status",
        ])
      )
      .max(32)
      .optional(),
    fromRole: role.optional(),
    toRole: role.optional(),
    fromStatus: status.optional(),
    toStatus: status.optional(),
    medicineId: z.uuid().optional(),
    quantity: z.number().int().nonnegative().max(2147483647).optional(),
    itemCount: z.number().int().nonnegative().max(1000).optional(),
  })
  .strict();
export const auditEventSchema = z
  .object({
    actorId: z.string().min(1).max(128).nullable(),
    action: z
      .string()
      .regex(/^[a-z_]+\.[a-z_]+$/)
      .max(80),
    targetType: z.enum([
      "user",
      "patient",
      "appointment",
      "queue_entry",
      "encounter",
      "vitals",
      "preliminary_note",
      "clinical_note",
      "prescription",
      "session",
      "medicine",
      "stock_batch",
      "dispense_record",
      "specialty",
      "doctor",
      "visit_reason",
      "hospital_settings",
    ]),
    targetId: z.string().min(1).max(128),
    metadata: auditMetadataSchema.default({}),
  })
  .strict();
export type AuditEvent = z.input<typeof auditEventSchema>;
