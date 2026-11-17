import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: mocks }));
vi.mock("@/lib/clinic-time", () => ({
  colomboNow: () => ({ date: "2026-11-17", time: "10:00:00" }),
}));
import { bookAppointment } from "@/lib/services/booking";

const input = {
  doctorId: "11111111-1111-4111-8111-111111111111",
  patientId: "22222222-2222-4222-8222-222222222222",
  date: "2026-11-17",
  actor: { userId: "patient-owner", role: "patient" },
};
function prepare(activeCount: number) {
  const rows = [
    [{ role: "patient", banned: false }],
    [{ userId: input.actor.userId }],
    [{ isActive: true, banned: false, role: "doctor", consultationFee: "1000.00" }],
    [{ isActive: true, endTime: "12:00:00", maxPatients: 2 }],
    [{ activeCount, lastNumber: activeCount }],
  ];
  const select = vi.fn(() => {
    const query = Object.assign(Promise.resolve(rows.shift() ?? []), {
      from: () => query,
      where: () => query,
      limit: () => query,
      innerJoin: () => query,
      for: () => query,
    });
    return query;
  });
  const values = vi.fn((record) => ({
    returning: async () => [{ id: "new-booking", ...record }],
  }));
  const insert = vi.fn(() => ({ values }));
  mocks.transaction.mockImplementation(async (run) => run({ select, insert }));
  return { insert, values };
}
beforeEach(() => vi.resetAllMocks());
describe("Booking capacity", () => {
  it("books an available place with the next appointment number", async () => {
    const { values } = prepare(1);
    expect(await bookAppointment(input)).toMatchObject({
      success: true,
      appointmentNo: 2,
    });
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: input.patientId,
        doctorId: input.doctorId,
        appointmentNo: 2,
      })
    );
  });
  it("rejects a full clinic without inserting an appointment", async () => {
    const { insert } = prepare(2);
    expect(await bookAppointment(input)).toMatchObject({
      success: false,
      statusCode: 409,
      code: "SESSION_FULL",
    });
    expect(insert).not.toHaveBeenCalled();
  });
});
