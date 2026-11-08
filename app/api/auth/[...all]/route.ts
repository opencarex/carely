import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { isBlockedAuthAdminPath } from "@/lib/auth-admin-policy";

const handlers = toNextJsHandler(auth);
export async function GET(request: Request) {
  if (isBlockedAuthAdminPath(request.url)) return new Response(null, { status: 404 });
  return handlers.GET(request);
}
export async function POST(request: Request) {
  if (isBlockedAuthAdminPath(request.url)) return new Response(null, { status: 404 });
  return handlers.POST(request);
}
