import { Panel } from "@/components/workspace/workspace-ui";
import type { NursePatient } from "@/lib/mock/nurse";
export function PatientContext({
  patient,
  lastSaved,
}: {
  patient: NursePatient;
  lastSaved: string;
}) {
  return (
    <Panel title="Patient context" className="min-w-0">
      <dl className="space-y-5 text-sm">
        <div>
          <dt className="text-sm font-semibold">Known condition</dt>
          <dd className="text-muted-foreground mt-1">{patient.condition}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold">Allergies</dt>
          <dd className="text-muted-foreground mt-1">{patient.allergies}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold">Last saved</dt>
          <dd className="text-muted-foreground mt-1">{lastSaved}</dd>
        </div>
      </dl>
    </Panel>
  );
}
