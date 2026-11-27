import { Card } from "@/components/ui/card";
import { LoadingFields } from "@/components/workspace/loading-skeleton";
import { PageTitle } from "@/components/workspace/workspace-ui";

export default function Loading() {
  return (
    <>
      <PageTitle
        eyebrow="Appointments"
        title="Appointment details"
        description="Keep your reference and appointment number for reception."
      />
      <Card className="p-5 sm:p-8">
        <LoadingFields label="Loading appointment details…" className="sm:grid-cols-2" />
      </Card>
    </>
  );
}
