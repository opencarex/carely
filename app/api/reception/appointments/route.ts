import { NextResponse } from "next/server";
import {
  receptionError,
  receptionHeaders,
  requireReceptionSession,
} from "@/lib/reception-http";
import { requireAppointmentSession } from "@/lib/appointment-http";
import {
  receptionAppointmentSearchSchema,
  receptionBookingSchema,
} from "@/lib/schemas/reception";
import { bookAppointment } from "@/lib/services/booking";
import { listReceptionAppointments } from "@/lib/services/reception";

export async function GET(request: Request) {
  try {
    const session = await requireAppointmentSession(request, ["receptionist"]);
    const search = new URL(request.url).searchParams;
    const parsed = receptionAppointmentSearchSchema.safeParse({
      q: search.get("q") ?? undefined,
      page: search.get("page") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Provide a valid booking search and page number." },
        { status: 400, headers: receptionHeaders }
      );
    }
    const result = await listReceptionAppointments(parsed.data, {
      userId: session.user.id,
      role: session.user.role,
    });
    return NextResponse.json(result, { headers: receptionHeaders });
  } catch (error) {
    return receptionError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireReceptionSession(request);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400, headers: receptionHeaders }
      );
    }
    const parsed = receptionBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Choose a valid patient, doctor, and appointment date." },
        { status: 400, headers: receptionHeaders }
      );
    }
    const result = await bookAppointment({
      ...parsed.data,
      actor: { userId: session.user.id, role: session.user.role },
    });
    return NextResponse.json(result, {
      status: result.success ? 201 : (result.statusCode ?? 400),
      headers: receptionHeaders,
    });
  } catch (error) {
    return receptionError(error);
  }
}
