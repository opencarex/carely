import { and, eq, gte, lte, ne, sql } from "drizzle-orm";
import { appointmentActions } from "@/lib/audit/actions/appointment";
import { db } from "@/lib/db";
import { colomboNow } from "@/lib/clinic-time";
import { appointment } from "@/lib/db/schema/appointment";
import { user } from "@/lib/db/schema/auth";
import { doctor } from "@/lib/db/schema/doctor";
import { doctorAvailability } from "@/lib/db/schema/doctor-availability";
import { patient } from "@/lib/db/schema/patient";
import { specialty } from "@/lib/db/schema/specialty";
import { visitReason } from "@/lib/db/schema/visit-reason";
import { queueEntry } from "@/lib/db/schema/queue-entry";
import {
  bookAppointmentSchema,
  openDatesQuerySchema,
  cancelAppointmentSchema,
  type BookAppointmentParams,
  type BookAppointmentResult,
  type CancelAppointmentParams,
  type OpenDatesResponse,
} from "@/lib/schemas/booking";
import { recordAudit } from "@/lib/services/audit";

export class BookingServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = "BookingServiceError";
  }
}

function failure(code: string, error: string, statusCode = 400): BookAppointmentResult {
  return { success: false, code, error, statusCode };
}

function isTokenConflict(error: unknown): boolean {
  // Drizzle wraps the postgres-js error in a query error's cause.
  if (!error || typeof error !== "object") return false;
  if (
    "code" in error &&
    error.code === "23505" &&
    "constraint_name" in error &&
    error.constraint_name === "appointment_doctor_date_no_unique"
  ) {
    return true;
  }
  return "cause" in error && isTokenConflict(error.cause);
}

/**
 * Called only by trusted server code with an actor derived from the session.
 * Patient callers must resolve/provision their profile before passing patientId.
 * The availability row serializes all bookings for this doctor and weekday.
 */
export async function bookAppointment(
  params: BookAppointmentParams
): Promise<BookAppointmentResult> {
  const input = bookAppointmentSchema.safeParse(params);
  if (!input.success) {
    return failure("INVALID_INPUT", input.error.issues[0].message);
  }

  const actor = params.actor;
  if (!actor || typeof actor.userId !== "string" || !actor.userId.trim()) {
    return failure("UNAUTHORIZED", "A signed-in user is required", 401);
  }
  if (!["patient", "receptionist", "admin"].includes(actor.role)) {
    return failure("FORBIDDEN", "You cannot book appointments", 403);
  }

  const { doctorId, patientId, date, visitReasonId } = input.data;
  // UTC arithmetic determines the weekday of the date label, independent of host TZ.
  const dayOfWeek = new Date(`${date}T00:00:00.000Z`).getUTCDay();

  try {
    return await db.transaction(
      async (tx): Promise<BookAppointmentResult> => {
        const [caller] = await tx
          .select({ role: user.role, banned: user.banned })
          .from(user)
          .where(eq(user.id, actor.userId))
          .limit(1);
        if (!caller || caller.banned || caller.role !== actor.role) {
          return failure("FORBIDDEN", "Your account cannot book appointments", 403);
        }

        const [targetPatient] = await tx
          .select({ userId: patient.userId })
          .from(patient)
          .where(eq(patient.id, patientId))
          .limit(1);
        if (actor.role === "patient" && targetPatient?.userId !== actor.userId) {
          return failure("FORBIDDEN", "You can only book your own appointments", 403);
        }
        if (!targetPatient) {
          return failure("PATIENT_NOT_FOUND", "Patient not found", 404);
        }

        const [targetDoctor] = await tx
          .select({
            isActive: doctor.isActive,
            consultationFee: doctor.consultationFee,
            banned: user.banned,
            role: user.role,
          })
          .from(doctor)
          .innerJoin(user, eq(doctor.userId, user.id))
          .where(eq(doctor.id, doctorId))
          .limit(1);
        if (!targetDoctor) {
          return failure("DOCTOR_NOT_FOUND", "Doctor not found", 404);
        }
        if (
          !targetDoctor.isActive ||
          targetDoctor.banned ||
          targetDoctor.role !== "doctor"
        ) {
          return failure("DOCTOR_INACTIVE", "Doctor is currently inactive");
        }

        if (visitReasonId) {
          const [reason] = await tx
            .select({ id: visitReason.id })
            .from(visitReason)
            .innerJoin(doctor, eq(doctor.id, doctorId))
            .where(
              and(
                eq(visitReason.id, visitReasonId),
                sql`${visitReason.specialtyId} = ${doctor.specialtyId}`
              )
            )
            .limit(1);
          if (!reason) {
            return failure("REASON_DOCTOR_MISMATCH", "Choose a doctor matched to your reason.");
          }
        }

        const [availability] = await tx
          .select()
          .from(doctorAvailability)
          .where(
            and(
              eq(doctorAvailability.doctorId, doctorId),
              eq(doctorAvailability.dayOfWeek, dayOfWeek)
            )
          )
          .for("update");
        if (!availability?.isActive) {
          return failure(
            "NO_ACTIVE_SESSION",
            "Doctor has no active clinic on this weekday"
          );
        }

        // Read the clock after acquiring the lock: a queued request may cross end_time.
        const now = colomboNow();
        if (date < now.date) {
          return failure("PAST_DATE", "Cannot book an appointment in the past");
        }
        if (date === now.date && now.time >= availability.endTime) {
          return failure("SESSION_ENDED", "Today's clinic session has already ended");
        }

        const [totals] = await tx
          .select({
            activeCount:
              sql<number>`count(*) filter (where ${appointment.status} <> 'cancelled')`.mapWith(
                Number
              ),
            lastNumber:
              sql<number>`coalesce(max(${appointment.appointmentNo}), 0)`.mapWith(Number),
          })
          .from(appointment)
          .where(
            and(eq(appointment.doctorId, doctorId), eq(appointment.appointmentDate, date))
          );
        if (totals.activeCount >= availability.maxPatients) {
          return failure("SESSION_FULL", "Session is fully booked", 409);
        }

        const [created] = await tx
          .insert(appointment)
          .values({
            doctorId,
            patientId,
            visitReasonId,
            appointmentDate: date,
            appointmentNo: totals.lastNumber + 1,
            status: "booked",
            source: actor.role === "patient" ? "online" : "reception",
            bookedBy: actor.userId,
            feeAmount: targetDoctor.consultationFee,
          })
          .returning();

        await recordAudit(tx, {
          actorId: actor.userId,
          action: appointmentActions.booked,
          targetType: "appointment",
          targetId: created.id,
          metadata: {},
        });

        return {
          success: true,
          appointment: created,
          appointmentNo: created.appointmentNo,
        };
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    if (isTokenConflict(error)) {
      return failure("TOKEN_CONFLICT", "Token slot conflict, please retry", 409);
    }
    throw error;
  }
}

/** Read-only discovery snapshot. Booking must recheck availability under its lock. */
export async function getOpenDatesForDoctor(
  doctorId: string
): Promise<OpenDatesResponse> {
  if (!openDatesQuerySchema.safeParse({ doctorId }).success) {
    throw new BookingServiceError("Provide a valid doctorId.", 400, "INVALID_INPUT");
  }

  const [profile] = await db
    .select({
      name: user.name,
      isActive: doctor.isActive,
      banned: user.banned,
      role: user.role,
      specialtyName: specialty.name,
    })
    .from(doctor)
    .innerJoin(user, eq(doctor.userId, user.id))
    .leftJoin(specialty, eq(doctor.specialtyId, specialty.id))
    .where(eq(doctor.id, doctorId))
    .limit(1);
  if (!profile) {
    throw new BookingServiceError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
  }
  if (!profile.isActive || profile.banned || profile.role !== "doctor") {
    throw new BookingServiceError("Doctor is currently inactive", 400, "DOCTOR_INACTIVE");
  }

  const now = colomboNow();
  const start = new Date(`${now.date}T00:00:00.000Z`);
  // Today through today + 13, using UTC arithmetic only on calendar date labels.
  const window = Array.from({ length: 14 }, (_, offset) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + offset);
    return { date: day.toISOString().slice(0, 10), dayOfWeek: day.getUTCDay() };
  });
  const bookingWindow = { startDate: window[0].date, endDate: window[13].date };
  const sessions = await db
    .select()
    .from(doctorAvailability)
    .where(
      and(
        eq(doctorAvailability.doctorId, doctorId),
        eq(doctorAvailability.isActive, true)
      )
    );
  const counts = await db
    .select({
      date: appointment.appointmentDate,
      bookedCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(appointment)
    .where(
      and(
        eq(appointment.doctorId, doctorId),
        gte(appointment.appointmentDate, bookingWindow.startDate),
        lte(appointment.appointmentDate, bookingWindow.endDate),
        ne(appointment.status, "cancelled")
      )
    )
    .groupBy(appointment.appointmentDate);

  const byWeekday = new Map(sessions.map((session) => [session.dayOfWeek, session]));
  const byDate = new Map(counts.map((count) => [count.date, count.bookedCount]));
  const dates: OpenDatesResponse["dates"] = [];
  const unavailableDates: OpenDatesResponse["unavailableDates"] = [];
  for (const day of window) {
    const session = byWeekday.get(day.dayOfWeek);
    if (!session) continue;

    const bookedCount = byDate.get(day.date) ?? 0;
    const availableCount = session.maxPatients - bookedCount;
    if (availableCount <= 0) {
      unavailableDates.push({ date: day.date, status: "full" });
      continue;
    }
    if (day.date === now.date && now.time >= session.endTime) {
      unavailableDates.push({ date: day.date, status: "ended" });
      continue;
    }

    dates.push({
      ...day,
      startTime: session.startTime,
      endTime: session.endTime,
      maxPatients: session.maxPatients,
      bookedCount,
      availableCount,
    });
  }

  return {
    doctorId,
    doctorName: profile.name,
    ...(profile.specialtyName === null ? {} : { specialtyName: profile.specialtyName }),
    bookingWindow,
    unavailableDates,
    dates,
  };
}

export async function cancelAppointment(
  params: CancelAppointmentParams
): Promise<{ success: boolean; error?: string; code?: string; statusCode?: number }> {
  if (!cancelAppointmentSchema.safeParse(params).success) {
    return failure("INVALID_INPUT", "Invalid appointment ID");
  }
  const { actor, appointmentId } = params;
  if (!actor?.userId) return failure("UNAUTHORIZED", "A signed-in user is required", 401);
  if (!["patient", "receptionist", "admin"].includes(actor.role)) {
    return failure("FORBIDDEN", "You cannot cancel appointments", 403);
  }

  return db.transaction(
    async (tx) => {
      const [caller] = await tx
        .select({ role: user.role, banned: user.banned })
        .from(user)
        .where(eq(user.id, actor.userId))
        .limit(1);
      if (!caller || caller.banned || caller.role !== actor.role) {
        return failure("FORBIDDEN", "Your account cannot cancel appointments", 403);
      }
      const [target] = await tx
        .select({
          doctorId: appointment.doctorId,
          date: appointment.appointmentDate,
          patientUserId: patient.userId,
        })
        .from(appointment)
        .innerJoin(patient, eq(appointment.patientId, patient.id))
        .where(eq(appointment.id, appointmentId))
        .limit(1);
      if (
        !target ||
        (actor.role === "patient" && target.patientUserId !== actor.userId)
      ) {
        return failure("APPOINTMENT_NOT_FOUND", "Appointment not found", 404);
      }

      // Lock availability before the appointment, matching booking's lock order.
      const weekday = new Date(`${target.date}T00:00:00Z`).getUTCDay();
      const [session] = await tx
        .select()
        .from(doctorAvailability)
        .where(
          and(
            eq(doctorAvailability.doctorId, target.doctorId),
            eq(doctorAvailability.dayOfWeek, weekday)
          )
        )
        .for("update");

      const [locked] = await tx
        .select()
        .from(appointment)
        .where(eq(appointment.id, appointmentId))
        .for("update");
      if (!locked) return failure("APPOINTMENT_NOT_FOUND", "Appointment not found", 404);
      if (locked.status === "cancelled") return { success: true };
      const [checkedIn] = await tx
        .select({ id: queueEntry.id })
        .from(queueEntry)
        .where(eq(queueEntry.appointmentId, appointmentId))
        .limit(1);
      if (checkedIn) {
        return failure(
          "APPOINTMENT_CLOSED",
          "This appointment has already been checked in and cannot be cancelled.",
          409
        );
      }
      const now = colomboNow();
      if (
        locked.status !== "booked" ||
        target.date < now.date ||
        (target.date === now.date && session && now.time >= session.endTime)
      ) {
        return failure(
          "APPOINTMENT_CLOSED",
          "This appointment can no longer be cancelled. Please contact reception.",
          409
        );
      }
      await tx
        .update(appointment)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(appointment.id, appointmentId));
      await recordAudit(tx, {
        actorId: actor.userId,
        action: appointmentActions.cancelled,
        targetType: "appointment",
        targetId: appointmentId,
        metadata: {},
      });
      return { success: true };
    },
    { isolationLevel: "read committed" }
  );
}
