import { ServiceError } from "@/lib/services/service-error";
import { NextResponse } from "next/server";
import { AuthError, requireRole } from "@/lib/auth-guard";
import { updateStaffStatusSchema, updateStaffDetailsSchema } from "@/lib/schemas/staff";
import {
  StaffServiceError,
  toggleStaffStatus,
  updateStaffMember,
} from "@/lib/services/staff";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await requireRole("admin", req.headers);
    const { id } = await params;
    const body = await req.json();

    const parsed = (
      body && typeof body === "object" && "active" in body
        ? updateStaffStatusSchema
        : updateStaffDetailsSchema
    ).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const actor = { userId: caller.user.id, role: caller.user.role };
    const result =
      "active" in parsed.data
        ? await toggleStaffStatus(id, parsed.data.active, actor)
        : await updateStaffMember(id, parsed.data, actor);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (
      err instanceof AuthError ||
      err instanceof StaffServiceError ||
      err instanceof ServiceError
    ) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    if (err instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    console.error("PATCH /api/admin/staff/[id] failed.");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
