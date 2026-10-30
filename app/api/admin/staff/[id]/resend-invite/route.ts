import { NextResponse } from "next/server";
import { AuthError, requireRole } from "@/lib/auth-guard";
import { resendStaffInvite, StaffServiceError } from "@/lib/services/staff";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin", req.headers);
    const { id } = await params;

    const result = await resendStaffInvite(id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError || err instanceof StaffServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("POST /api/admin/staff/[id]/resend-invite error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
