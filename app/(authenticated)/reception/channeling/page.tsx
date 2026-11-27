import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingRows } from "@/components/workspace/loading-skeleton";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { OnSiteChanneling } from "@/components/reception/on-site-channeling";

export const metadata: Metadata = { title: "On-site Channeling" };
export const instant = false;

export default function OnSiteChannelingPage() {
  return (
    <>
      <PageTitle
        eyebrow="Front desk"
        title="On-site Channeling"
        description="Assign a walk-in patient to an available doctor slot."
      />
      <Suspense fallback={<LoadingRows label="Loading channeling…" />}>
        <OnSiteChanneling />
      </Suspense>
    </>
  );
}
