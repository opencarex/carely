import type { Metadata } from "next";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { QueueManagement } from "@/components/reception/queue-management";

export const metadata: Metadata = { title: "Hospital Queue Management" };
export const instant = false;

export default function QueueManagementPage() {
  return (
    <>
      <PageTitle
        eyebrow="Front desk"
        title="Hospital Queue Management"
        description="Live view of every doctor queue and wait time across the hospital."
      />
      <QueueManagement />
    </>
  );
}
