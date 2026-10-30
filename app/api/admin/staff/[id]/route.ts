import { NextResponse } from "next/server";
import { AuthError, requireRole } from "@/lib/auth-guard";
import { updateStaffStatusSchema } from "@/lib/schemas/staff";
import { StaffServiceError, toggleStaffStatus } from "@/lib/services/staff";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin", req.headers);
    const { id } = await params;
    const body = await req.json();

    const parsed = updateStaffStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await toggleStaffStatus(id, parsed.data.active);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError || err instanceof StaffServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("PATCH /api/admin/staff/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
