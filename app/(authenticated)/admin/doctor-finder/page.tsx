import type { Metadata } from "next";
import { DoctorReasonConfig } from "@/components/admin/doctor-reason-config";
import { PageTitle } from "@/components/workspace/workspace-ui";

export const metadata: Metadata = { title: "Doctor Finder" };
export const instant = false;

export default function AdminDoctorFinderPage() {
  return (
    <>
      <PageTitle
        eyebrow="Administration"
        title="Doctor Finder"
        description="Assign visit reasons to each doctor."
      />
      <DoctorReasonConfig />
    </>
  );
}
