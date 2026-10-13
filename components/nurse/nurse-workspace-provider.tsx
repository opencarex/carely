"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { nursePatients } from "@/lib/mock/nurse";
export type VisitRecord = {
  vitals?: Record<string, string>;
  complaint?: string;
  observations?: string;
  vitalsSaved?: string;
  notesSaved?: string;
};
const NurseContext = createContext<{
  patientId: string;
  visitId: string;
  records: Record<string, VisitRecord>;
  select: (patientId: string, visitId: string) => void;
  save: (visitId: string, record: VisitRecord) => void;
} | null>(null);

/**
 * Temporary UI prototype state; demo saves reset on a full page reload.
 * Remove after URL-based patient/visit selection and database reads/writes
 * replace its responsibilities. Move VisitRecord types before deletion.
 * See docs/nurse-architecture.md for the migration conditions.
 */
export function NurseWorkspaceProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState({
    patientId: "P-00155",
    visitId: "APT-1050",
  });
  const [records, setRecords] = useState<Record<string, VisitRecord>>({});
  return (
    <NurseContext.Provider
      value={{
        ...selection,
        records,
        select: (patientId, visitId) => setSelection({ patientId, visitId }),
        save: (visitId, record) =>
          setRecords((previous) => ({
            ...previous,
            [visitId]: { ...previous[visitId], ...record },
          })),
      }}
    >
      {children}
    </NurseContext.Provider>
  );
}

export function useNurseWorkspace() {
  const workspace = useContext(NurseContext);
  if (!workspace) throw new Error("Nurse pages require NurseWorkspaceProvider");
  const patient = nursePatients.find((item) => item.id === workspace.patientId)!;
  const record = workspace.records[workspace.visitId] ?? {};
  return { workspace, patient, record };
}
