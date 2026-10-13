import type { Metadata } from "next";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { MedicineInventory } from "@/components/pharmacy/medicine-inventory";

export const metadata: Metadata = { title: "Inventory Dashboard" };
export const instant = false;

export default function MedicineInventoryPage() {
  return (
    <>
      <PageTitle
        eyebrow="Pharmacy workspace"
        title="Inventory Dashboard"
        description="Monitor stock quantity, reorder thresholds and expiry risks."
      />
      <MedicineInventory />
    </>
  );
}
