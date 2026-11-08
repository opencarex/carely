import type { ReactNode } from "react";
import { redirect, unstable_rethrow } from "next/navigation";
import { AuthError, requireAuth } from "@/lib/auth-guard";

export const instant = false;

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  try {
    await requireAuth();
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthError) redirect("/login");
    throw error;
  }
  return children;
}
