import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingRows } from "@/components/workspace/loading-skeleton";
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
        description="Manage the medicine catalogue and available stock."
      />
      <Suspense fallback={<LoadingRows label="Loading medicine inventory…" />}>
        <MedicineInventory />
      </Suspense>
    </>
  );
}
