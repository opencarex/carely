"use client";
import { PageTitle, Panel } from "@/components/workspace/workspace-ui";
import { PatientVisitPicker } from "@/components/nurse/patient-visit-picker";
import { PatientContext } from "@/components/nurse/patient-context";
import { VitalsForm } from "@/components/nurse/vitals-form";
import { useNurseWorkspace } from "@/components/nurse/nurse-workspace-provider";
import { nursePatients } from "@/lib/mock/nurse";
export default function NurseVitalsPage() {
  const { workspace, patient, record } = useNurseWorkspace();
  const lastSaved =
    record.vitalsSaved ??
    (workspace.visitId === "APT-1050"
      ? "N. Fernando · Today, 10:20 AM"
      : "No records saved yet");
  return (
    <>
      <title>Record Vitals | Carely</title>
      <PageTitle
        eyebrow="Care workspace"
        title="Record Vitals"
        description="Find a patient and select the visit to update."
      />
      <PatientVisitPicker
        patient={patient}
        patients={nursePatients}
        visitId={workspace.visitId}
        onSelect={workspace.select}
      />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Panel title="Measurements" className="min-w-0 lg:col-span-2">
          <VitalsForm
            key={workspace.visitId}
            visitId={workspace.visitId}
            record={record}
            onSave={(values) => workspace.save(workspace.visitId, values)}
          />
        </Panel>
        <PatientContext patient={patient} lastSaved={lastSaved} />
      </div>
    </>
  );
}
