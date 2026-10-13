import type { Metadata } from "next";
import { HospitalDetailsForm } from "@/components/admin/hospital-details-form";
import { RolePermissionsForm } from "@/components/admin/role-permissions-form";
import { PageTitle } from "@/components/workspace/workspace-ui";

export const metadata: Metadata = { title: "System Settings" };
export const instant = false;

export default function AdminSettingsPage() {
  return (
    <>
      <PageTitle
        eyebrow="Administration"
        title="System Settings"
        description="Manage hospital details and staff role permissions."
      />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <HospitalDetailsForm />
        <RolePermissionsForm />
      </div>
    </>
  );
}
