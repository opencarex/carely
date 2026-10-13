import { patientMedicines } from "@/lib/mock/patient";
import { StatusBadge } from "@/components/patient/patient-shared";

export function PrescriptionMedicine({
  item,
}: {
  item: (typeof patientMedicines)[number];
}) {
  return (
    <div className="flex min-h-28 flex-col justify-between gap-4 rounded-xl border p-4 xl:flex-row xl:items-center">
      <div className="flex items-center gap-3.5">
        <span className="bg-secondary text-primary grid size-11 shrink-0 place-items-center rounded-xl text-xs font-bold">
          {item.code}
        </span>
        <div className="space-y-0.5">
          <p className="text-foreground text-sm font-semibold sm:text-base">
            {item.name}
          </p>
          <p className="text-muted-foreground text-xs">{item.form}</p>
          <p className="text-primary text-xs font-semibold sm:text-sm">{item.dose}</p>
          <p className="text-muted-foreground text-xs">{item.note}</p>
        </div>
      </div>
      <StatusBadge tone="blue">Prescribed</StatusBadge>
    </div>
  );
}
