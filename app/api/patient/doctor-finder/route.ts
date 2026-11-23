import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { AuthError, requireRole } from "@/lib/auth-guard";
import { doctorFinderQuerySchema } from "@/lib/schemas/admin-config";
import { ServiceError } from "@/lib/services/service-error";
import { findDoctorsForReason } from "@/lib/services/visit-reason";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  try {
    await requireRole("patient", request.headers);
    const reasonIds = new URL(request.url).searchParams.getAll("reasonId");
    const parsed = doctorFinderQuerySchema.safeParse({ reasonId: reasonIds[0] });
    if (reasonIds.length !== 1 || !parsed.success) {
      return NextResponse.json({ error: "Provide one valid reasonId.", code: "INVALID_INPUT" }, { status: 400, headers });
    }
    const doctors = await findDoctorsForReason(parsed.data.reasonId);
    return NextResponse.json({ doctors, ...(doctors.length ? {} : { message: "No active doctors are available for this reason." }) }, { headers });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthError || error instanceof ServiceError) return NextResponse.json({ error: error.message, ...(error instanceof ServiceError ? { code: error.code } : {}) }, { status: error.statusCode, headers });
    console.error("GET /api/patient/doctor-finder error:", error);
    return NextResponse.json({ error: "Unable to find doctors. Please try again." }, { status: 500, headers });
  }
}
