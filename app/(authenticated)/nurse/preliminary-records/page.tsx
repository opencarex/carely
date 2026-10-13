"use client";
import { PageTitle, Panel } from "@/components/workspace/workspace-ui";
import { PatientVisitPicker } from "@/components/nurse/patient-visit-picker";
import { PatientContext } from "@/components/nurse/patient-context";
import { PreliminaryForm } from "@/components/nurse/preliminary-form";
import { useNurseWorkspace } from "@/components/nurse/nurse-workspace-provider";
import { nursePatients } from "@/lib/mock/nurse";
export default function NursePreliminaryRecordsPage() {
  const { workspace, patient, record } = useNurseWorkspace();
  const lastSaved =
    record.notesSaved ??
    (workspace.visitId === "APT-1050"
      ? "N. Fernando · Today, 10:20 AM"
      : "No records saved yet");
  return (
    <>
      <title>Preliminary Records | Carely</title>
      <PageTitle
        eyebrow="Care workspace"
        title="Add Preliminary Records"
        description="Find a patient and select the visit to update."
      />
      <PatientVisitPicker
        patient={patient}
        patients={nursePatients}
        visitId={workspace.visitId}
        onSelect={workspace.select}
      />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Panel title="Preliminary records" className="min-w-0 lg:col-span-2">
          <PreliminaryForm
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
