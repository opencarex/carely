import { ServiceError } from "@/lib/services/service-error";
import { NextResponse } from "next/server";
import { AuthError, requireRole } from "@/lib/auth-guard";
import { createStaffSchema } from "@/lib/schemas/staff";
import {
  createStaffMember,
  listStaffMembers,
  StaffServiceError,
} from "@/lib/services/staff";

export async function GET(req: Request) {
  try {
    await requireRole("admin", req.headers);
    const staff = await listStaffMembers();
    return NextResponse.json({ staff });
  } catch (err: unknown) {
    if (
      err instanceof AuthError ||
      err instanceof StaffServiceError ||
      err instanceof ServiceError
    ) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("GET /api/admin/staff error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const caller = await requireRole("admin", req.headers);
    const body = await req.json();

    const parsed = createStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await createStaffMember(parsed.data, {
      userId: caller.user.id,
      role: caller.user.role,
    });
    return NextResponse.json(result, { status: 201 });
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
    console.error("POST /api/admin/staff failed.");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
