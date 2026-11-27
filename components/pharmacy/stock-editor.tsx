"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/workspace/workspace-ui";
import { StockItemForm } from "./stock-item-form";
import { StockBadge } from "./stock-badge";
import {
  StockBatchesSkeleton,
  StockEditorSkeleton,
  stockBatchRowClassName,
} from "./stock-skeleton";
import { useMedicineCatalogue } from "./pharmacy-api";
import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";
import type { MedicineStockView, StockBatchesResponse } from "@/lib/schemas/pharmacy";

function MedicineBatches({
  medicine,
  today,
  onReceived,
}: {
  medicine: MedicineStockView;
  today: string;
  onReceived: () => Promise<void>;
}) {
  const { data, loading, error, refresh } = useVisiblePolling<StockBatchesResponse>(
    `/api/pharmacy/medicines/${medicine.id}/batches`
  );
  return (
    <div className="space-y-5">
      <Panel title="Receive stock">
        <StockItemForm
          medicine={medicine}
          today={today}
          onSaved={() => {
            void refresh();
            void onReceived();
          }}
        />
      </Panel>
      <Panel title="Stock batches">
        {loading && <StockBatchesSkeleton />}
        {error && (
          <p role="alert" className="text-destructive">
            Unable to load the latest batches.{" "}
            <Button variant="link" onClick={() => void refresh()}>
              Retry
            </Button>
          </p>
        )}
        <div className="space-y-3">
          {data?.batches.map((batch) => (
            <article key={batch.id} className={stockBatchRowClassName}>
              <div>
                <p className="font-semibold">{batch.batchNo}</p>
                <p className="text-muted-foreground">
                  Received{" "}
                  {new Date(batch.receivedAt).toLocaleString("en-GB", {
                    timeZone: "Asia/Colombo",
                  })}
                </p>
              </div>
              <div>
                <p>Remaining: {batch.quantityOnHand}</p>
                <p
                  className={
                    batch.expiryDate < data.today
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }
                >
                  Expiry {batch.expiryDate}
                  {batch.expiryDate < data.today ? " · Expired" : ""}
                </p>
              </div>
            </article>
          ))}
          {data && !data.batches.length && (
            <p className="text-muted-foreground text-sm">
              No stock batches received yet.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}

export function StockEditor() {
  const { data, loading, error, refresh } = useMedicineCatalogue();
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedId = searchParams.get("medicine");
  const medicine =
    data?.medicines.find((item) => item.id === requestedId) ?? data?.medicines[0];

  if (loading) return <StockEditorSkeleton />;

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="text-destructive">
          Unable to load the latest stock.{" "}
          <Button variant="link" onClick={() => void refresh()}>
            Retry
          </Button>
        </p>
      )}
      {data && !medicine && (
        <p>
          No medicines yet.{" "}
          <Link href="/pharmacy" className="text-primary underline">
            Add a medicine
          </Link>{" "}
          before receiving stock.
        </p>
      )}
      {medicine && data && (
        <>
          <div className="bg-card space-y-3 rounded-xl border p-4">
            <label htmlFor="stock-medicine" className="block text-sm font-semibold">
              Select medicine
            </label>
            <select
              id="stock-medicine"
              className="bg-card w-full rounded-lg border p-3 text-sm"
              value={medicine.id}
              onChange={(event) =>
                router.replace(
                  `/pharmacy/stock?medicine=${encodeURIComponent(event.target.value)}`,
                  { scroll: false }
                )
              }
            >
              {data.medicines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.strength}
                  {!item.isActive ? " (inactive)" : ""}
                </option>
              ))}
            </select>
            <p className="text-sm">
              {medicine.form} · Available quantity:{" "}
              <strong>{medicine.quantityOnHand}</strong>
            </p>
            <StockBadge medicine={medicine} />
            <p className="text-muted-foreground text-sm">
              Expired batches are excluded from the available quantity.
            </p>
          </div>
          <MedicineBatches
            key={medicine.id}
            medicine={medicine}
            today={data.today}
            onReceived={refresh}
          />
        </>
      )}
    </div>
  );
}
