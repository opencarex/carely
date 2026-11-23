import { and, count, countDistinct, eq, inArray, ne, sql } from "drizzle-orm";
import { colomboNow } from "@/lib/clinic-time";
import { db } from "@/lib/db";
import { appointment } from "@/lib/db/schema/appointment";
import { user } from "@/lib/db/schema/auth";
import { doctor } from "@/lib/db/schema/doctor";
import { doctorAvailability } from "@/lib/db/schema/doctor-availability";
import { queueEntry } from "@/lib/db/schema/queue-entry";
import { staffRoleEnum } from "@/lib/schemas/staff";
import { assertActiveActor, type Actor } from "./access-policy";
import { queryAuditLog } from "./audit-query";
import { ServiceError } from "./service-error";

export async function getAdminOverview(actor: Actor) {
  if (actor.role !== "admin") throw new ServiceError("Forbidden.", 403, "FORBIDDEN");
  await assertActiveActor(actor);
  const date = colomboNow().date;
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
  const activeAccount = sql`coalesce(${user.banned}, false) = false`;
  const [[staff], [doctors], [queues], { entries }] = await Promise.all([
    db
      .select({ total: count() })
      .from(user)
      .where(and(inArray(user.role, staffRoleEnum.options), activeAccount)),
    db
      .select({ total: countDistinct(doctor.id) })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .innerJoin(doctorAvailability, eq(doctorAvailability.doctorId, doctor.id))
      .where(
        and(
          eq(user.role, "doctor"),
          eq(doctor.isActive, true),
          eq(doctorAvailability.isActive, true),
          eq(doctorAvailability.dayOfWeek, dayOfWeek),
          activeAccount
        )
      ),
    db
      .select({ total: countDistinct(appointment.doctorId) })
      .from(queueEntry)
      .innerJoin(appointment, eq(queueEntry.appointmentId, appointment.id))
      .where(
        and(
          eq(appointment.appointmentDate, date),
          eq(appointment.status, "booked"),
          ne(queueEntry.status, "completed")
        )
      ),
    queryAuditLog({ pageSize: "5" }),
  ]);
  return {
    staffCount: staff.total,
    scheduledDoctors: doctors.total,
    openQueues: queues.total,
    entries,
  };
}
