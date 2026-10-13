import type { Metadata } from "next";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { StockEditor } from "@/components/pharmacy/stock-editor";

export const metadata: Metadata = { title: "Edit Stock Item" };
export const instant = false;

export default function StockEditorPage() {
  return (
    <>
      <PageTitle
        eyebrow="Pharmacy workspace"
        title="Edit Stock Item"
        description="Update quantity, reorder threshold and expiry details."
      />
      <StockEditor />
    </>
  );
}
