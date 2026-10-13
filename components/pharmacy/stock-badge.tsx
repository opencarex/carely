import { Badge } from "@/components/ui/badge";
import { stockStatus, type MedicineStock } from "@/lib/mock/pharmacy";

export function StockBadge({ medicine }: { medicine: MedicineStock }) {
  const status = stockStatus(medicine);
  return (
    <Badge
      className={
        status === "In stock"
          ? "bg-carely-success-soft text-carely-success"
          : status === "Low stock"
            ? "bg-amber-50 text-amber-800"
            : "bg-red-50 text-red-700"
      }
    >
      {status}
    </Badge>
  );
}
