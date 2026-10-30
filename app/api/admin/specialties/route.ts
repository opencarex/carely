import { NextResponse } from "next/server";
import { AuthError, requireRole } from "@/lib/auth-guard";
import { listSpecialties, StaffServiceError } from "@/lib/services/staff";

export async function GET(req: Request) {
  try {
    await requireRole("admin", req.headers);
    const specialties = await listSpecialties();
    return NextResponse.json({ specialties });
  } catch (err: unknown) {
    if (err instanceof AuthError || err instanceof StaffServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("GET /api/admin/specialties error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
