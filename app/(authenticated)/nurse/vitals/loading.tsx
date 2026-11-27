import { Card } from "@/components/ui/card";
import { LoadingFields } from "@/components/workspace/loading-skeleton";
import { PageTitle } from "@/components/workspace/workspace-ui";

export default function Loading() {
  return (
    <>
      <PageTitle
        eyebrow="Care workspace"
        title="Nurse Intake"
        description="Record vitals and preliminary notes, then hand the visit to the doctor."
      />
      <Card className="p-4 sm:p-6">
        <LoadingFields label="Loading the intake queue…" count={1} />
      </Card>
    </>
  );
}
