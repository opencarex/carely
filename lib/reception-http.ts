import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { AuthError } from "@/lib/auth-guard";
import { appointmentHeaders, requireAppointmentSession } from "@/lib/appointment-http";
import { ReceptionServiceError } from "@/lib/services/reception";
import { BookingServiceError } from "@/lib/services/booking";
import { ServiceError } from "@/lib/services/service-error";

export const receptionHeaders = appointmentHeaders;

export async function requireReceptionSession(request: Request) {
  return requireAppointmentSession(request, ["receptionist", "admin"]);
}

export function receptionError(error: unknown) {
  unstable_rethrow(error);
  if (
    error instanceof AuthError ||
    error instanceof ReceptionServiceError ||
    error instanceof BookingServiceError ||
    error instanceof ServiceError
  ) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error instanceof ReceptionServiceError || error instanceof ServiceError
          ? { code: error.code }
          : {}),
      },
      { status: error.statusCode, headers: receptionHeaders }
    );
  }
  console.error("Reception request failed:", error);
  return NextResponse.json(
    { error: "Unable to complete the reception request. Please try again." },
    { status: 500, headers: receptionHeaders }
  );
}
