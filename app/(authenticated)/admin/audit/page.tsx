import type { Metadata } from "next";
import { AuditTrail } from "@/components/admin/audit-trail";
import { PageTitle } from "@/components/workspace/workspace-ui";

export const metadata: Metadata = { title: "Audit Trail" };
export const instant = false;

export default function AdminAuditPage() {
  return (
    <>
      <PageTitle
        eyebrow="Administration"
        title="Audit Trail"
        description="Immutable, read-only history of security and operational actions."
      />
      <AuditTrail />
    </>
  );
}
