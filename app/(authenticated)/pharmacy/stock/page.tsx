import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { StockEditor } from "@/components/pharmacy/stock-editor";
import { StockEditorSkeleton } from "@/components/pharmacy/stock-skeleton";

export const metadata: Metadata = { title: "Receive Stock" };
export const instant = false;

export default function StockEditorPage() {
  return (
    <>
      <PageTitle
        eyebrow="Pharmacy workspace"
        title="Receive Stock"
        description="Receive stock batches and review quantities and expiry dates."
      />
      <Suspense fallback={<StockEditorSkeleton />}>
        <StockEditor />
      </Suspense>
    </>
  );
}
