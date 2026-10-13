import type { Metadata } from "next";
import { StaffDirectory } from "@/components/admin/staff-directory";
import { PageTitle } from "@/components/workspace/workspace-ui";

export const metadata: Metadata = { title: "Staff Management" };
export const instant = false;

export default function AdminStaffPage() {
  return (
    <>
      <PageTitle
        eyebrow="Administration"
        title="Staff Management"
        description="Manage staff accounts, roles, departments and status."
      />
      <StaffDirectory />
    </>
  );
}
