import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gte,
  inArray,
  isNotNull,
  sql,
  sum,
} from "drizzle-orm";
import { colomboNow } from "@/lib/clinic-time";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema/auth";
import { doctor } from "@/lib/db/schema/doctor";
import { medicine } from "@/lib/db/schema/medicine";
import { patient } from "@/lib/db/schema/patient";
import { prescriptionItem } from "@/lib/db/schema/prescription-item";
import { prescription } from "@/lib/db/schema/prescription";
import { encounter } from "@/lib/db/schema/encounter";
import { stockBatch } from "@/lib/db/schema/stock-batch";
import { prescriptionActions } from "@/lib/audit/actions/prescription";
import {
  createPrescriptionSchema,
  prescriptionEncounterParamsSchema,
  prescriptionParamsSchema,
  type CreatedPrescription,
  type CreatePrescriptionInput,
  type DispensingEligibility,
  type PharmacistPrescriptionView,
  type PrescriptionCatalogueResponse,
  type PrescriptionItemView,
  type PrescriptionView,
} from "@/lib/schemas/prescription";
import { assertActiveActor, canViewPrescription, type Actor } from "./access-policy";
import { recordAudit } from "./audit";
import { assertEncounterWritable } from "./encounter";
import { ServiceError } from "./service-error";

function assertDoctor(actor: Actor) {
  if (actor.role !== "doctor") {
    throw new ServiceError("Only doctors can create prescriptions.", 403, "FORBIDDEN");
  }
}

function assertEncounterId(encounterId: string) {
  if (!prescriptionEncounterParamsSchema.safeParse({ id: encounterId }).success) {
    throw new ServiceError("Invalid encounter identifier.", 400, "INVALID_ID");
  }
}

function toPrescriptionView(
  header: {
    id: string;
    encounterId: string;
    doctorId: string;
    status: string;
    createdAt: Date;
  },
  items: PrescriptionItemView[]
): PrescriptionView {
  return {
    ...header,
    createdAt: header.createdAt.toISOString(),
    itemCount: items.length,
    items,
  };
}

async function getItems(prescriptionId: string): Promise<PrescriptionItemView[]> {
  return db
    .select({
      id: prescriptionItem.id,
      medicineId: prescriptionItem.medicineId,
      name: sql<string>`coalesce(${prescriptionItem.medicineName}, ${medicine.name})`,
      form: medicine.form,
      strength: medicine.strength,
      dosage: prescriptionItem.dosage,
      frequency: prescriptionItem.frequency,
      durationDays: prescriptionItem.durationDays,
      quantity: prescriptionItem.quantity,
      instructions: prescriptionItem.instructions,
    })
    .from(prescriptionItem)
    .leftJoin(medicine, eq(prescriptionItem.medicineId, medicine.id))
    .where(eq(prescriptionItem.prescriptionId, prescriptionId))
    .orderBy(asc(prescriptionItem.id));
}

async function getDispensingEligibility(
  view: PrescriptionView
): Promise<DispensingEligibility> {
  if (view.status === "dispensed") return { status: "dispensed" };

  const required = new Map<string, { name: string; quantity: number }>();
  for (const item of view.items) {
    if (item.medicineId === null) continue;
    const previous = required.get(item.medicineId);
    if (previous) {
      previous.quantity += item.quantity;
    } else {
      required.set(item.medicineId, {
        name: `${item.name} ${item.strength}`,
        quantity: item.quantity,
      });
    }
  }
  if (!required.size) return { status: "empty" };

  const batches = await db
    .select({
      medicineId: stockBatch.medicineId,
      quantity: sum(stockBatch.quantityOnHand),
    })
    .from(stockBatch)
    .where(
      and(
        inArray(stockBatch.medicineId, [...required.keys()]),
        gte(stockBatch.expiryDate, colomboNow().date)
      )
    )
    .groupBy(stockBatch.medicineId);
  const available = new Map(
    batches.map((batch) => [batch.medicineId, Number(batch.quantity)])
  );
  const shortMedicines = [...required]
    .filter(([id, item]) => (available.get(id) ?? 0) < item.quantity)
    .map(([, item]) => item.name);
  return shortMedicines.length
    ? { status: "insufficient_stock", shortMedicines }
    : { status: "ready" };
}

export async function createPrescription(input: {
  encounterId: string;
  prescription: CreatePrescriptionInput;
  actor: Actor;
}): Promise<CreatedPrescription> {
  assertDoctor(input.actor);
  assertEncounterId(input.encounterId);
  const parsed = createPrescriptionSchema.safeParse(input.prescription);
  if (!parsed.success) {
    throw new ServiceError("Provide a valid prescription.", 400, "INVALID_PRESCRIPTION");
  }
  return db.transaction(async (tx) => {
    const visit = await assertEncounterWritable(input.encounterId, input.actor, tx);
    const medicineIds = parsed.data.items.flatMap((item) =>
      "medicineId" in item ? [item.medicineId] : []
    );
    if (medicineIds.length) {
      const activeMedicines = await tx
        .select({ id: medicine.id })
        .from(medicine)
        .where(and(inArray(medicine.id, medicineIds), eq(medicine.isActive, true)))
        .for("share");
      if (activeMedicines.length !== medicineIds.length) {
        throw new ServiceError(
          "One or more medicines are unavailable.",
          400,
          "INVALID_MEDICINE"
        );
      }
    }
    const createdAt = new Date();
    const [saved] = await tx
      .insert(prescription)
      .values({
        encounterId: visit.id,
        doctorId: visit.doctorId,
        createdAt,
      })
      .returning({
        id: prescription.id,
        encounterId: prescription.encounterId,
        doctorId: prescription.doctorId,
        status: prescription.status,
        createdAt: prescription.createdAt,
      });
    await tx.insert(prescriptionItem).values(
      parsed.data.items.map((item) => ({
        ...item,
        prescriptionId: saved.id,
      }))
    );
    await recordAudit(tx, {
      actorId: input.actor.userId,
      action: prescriptionActions.created,
      targetType: "prescription",
      targetId: saved.id,
      metadata: { itemCount: parsed.data.items.length },
    });
    return {
      ...saved,
      createdAt: saved.createdAt.toISOString(),
      itemCount: parsed.data.items.length,
    };
  });
}

export async function listPrescriptionMedicines(
  actor: Actor
): Promise<PrescriptionCatalogueResponse> {
  assertDoctor(actor);
  await assertActiveActor(actor);
  const medicines = await db
    .select({
      id: medicine.id,
      name: medicine.name,
      form: medicine.form,
      strength: medicine.strength,
    })
    .from(medicine)
    .where(eq(medicine.isActive, true))
    .orderBy(asc(medicine.name), asc(medicine.strength), asc(medicine.id));
  return { medicines };
}

export async function getPrescription(input: {
  prescriptionId: string;
  actor: Actor;
}): Promise<PharmacistPrescriptionView> {
  if (!prescriptionParamsSchema.safeParse({ id: input.prescriptionId }).success) {
    throw new ServiceError("Invalid prescription identifier.", 400, "INVALID_ID");
  }
  if (input.actor.role !== "pharmacist") {
    throw new ServiceError(
      "Only pharmacists can access this prescription.",
      403,
      "FORBIDDEN"
    );
  }
  await assertActiveActor(input.actor);
  if (!(await canViewPrescription(input.actor, input.prescriptionId))) {
    throw new ServiceError("Prescription not found.", 404, "NOT_FOUND");
  }
  const [header] = await db
    .select({
      id: prescription.id,
      encounterId: prescription.encounterId,
      doctorId: prescription.doctorId,
      status: prescription.status,
      createdAt: prescription.createdAt,
    })
    .from(prescription)
    .where(eq(prescription.id, input.prescriptionId))
    .limit(1);
  if (!header) throw new ServiceError("Prescription not found.", 404, "NOT_FOUND");
  const view = toPrescriptionView(header, await getItems(header.id));
  return { ...view, dispensing: await getDispensingEligibility(view) };
}

async function findPatientPrescriptionOwner(actor: Actor) {
  if (actor.role !== "patient") {
    throw new ServiceError(
      "Only patients can access their prescriptions.",
      403,
      "FORBIDDEN"
    );
  }
  await assertActiveActor(actor);
  const [profile] = await db
    .select({ id: patient.id })
    .from(patient)
    .where(eq(patient.userId, actor.userId))
    .limit(1);
  return profile;
}

export async function getPatientPrescriptionSummary(actor: Actor) {
  const profile = await findPatientPrescriptionOwner(actor);
  if (!profile) return { pendingCount: 0, latest: null };
  const belongsToPatient = eq(encounter.patientId, profile.id);
  const [pendingRows, [latest]] = await Promise.all([
    db
      .select({ total: count() })
      .from(prescription)
      .innerJoin(encounter, eq(prescription.encounterId, encounter.id))
      .where(
        and(
          belongsToPatient,
          eq(prescription.status, "issued"),
          exists(
            db
              .select({ id: prescriptionItem.id })
              .from(prescriptionItem)
              .where(
                and(
                  eq(prescriptionItem.prescriptionId, prescription.id),
                  isNotNull(prescriptionItem.medicineId)
                )
              )
          )
        )
      ),
    db
      .select({
        id: prescription.id,
        encounterId: prescription.encounterId,
        doctorId: prescription.doctorId,
        doctorName: user.name,
        status: prescription.status,
        createdAt: prescription.createdAt,
      })
      .from(prescription)
      .innerJoin(encounter, eq(prescription.encounterId, encounter.id))
      .innerJoin(doctor, eq(prescription.doctorId, doctor.id))
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(belongsToPatient)
      .orderBy(desc(prescription.createdAt), desc(prescription.id))
      .limit(1),
  ]);
  return {
    pendingCount: pendingRows[0]?.total ?? 0,
    latest: latest
      ? {
          ...toPrescriptionView(latest, await getItems(latest.id)),
          doctorName: latest.doctorName,
        }
      : null,
  };
}

export async function getPatientPrescriptions(actor: Actor): Promise<PrescriptionView[]> {
  const profile = await findPatientPrescriptionOwner(actor);
  if (!profile) throw new ServiceError("Patient record not found.", 404, "NOT_FOUND");
  const headers = await db
    .select({
      id: prescription.id,
      encounterId: prescription.encounterId,
      doctorId: prescription.doctorId,
      status: prescription.status,
      createdAt: prescription.createdAt,
    })
    .from(prescription)
    .innerJoin(encounter, eq(prescription.encounterId, encounter.id))
    .where(eq(encounter.patientId, profile.id))
    .orderBy(asc(prescription.createdAt), asc(prescription.id));
  return Promise.all(
    headers.map(async (header) => toPrescriptionView(header, await getItems(header.id)))
  );
}
