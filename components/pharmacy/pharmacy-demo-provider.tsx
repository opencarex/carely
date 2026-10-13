"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  pharmacyMedicines,
  pharmacyPrescriptions,
  type MedicineStock,
  type PharmacyPrescription,
} from "@/lib/mock/pharmacy";

type StockChange = { medicineId: string; from: number; to: number; time: string };
type PharmacyState = {
  medicines: MedicineStock[];
  prescriptions: PharmacyPrescription[];
  setPrescriptions: Dispatch<SetStateAction<PharmacyPrescription[]>>;
  changes: StockChange[];
  updateStock: (medicine: MedicineStock) => void;
};
const PharmacyContext = createContext<PharmacyState | null>(null);
/** Temporary demo state shared by stock editing and dispensing. Replace with database reads/writes; see docs/pharmacy-reception-ui.md. */
export function PharmacyDemoProvider({ children }: { children: ReactNode }) {
  const [medicines, setMedicines] = useState(pharmacyMedicines);
  const [prescriptions, setPrescriptions] = useState(pharmacyPrescriptions);
  const [changes, setChanges] = useState<StockChange[]>([
    { medicineId: "MED-0042", from: 82, to: 72, time: "17 Sep, 09:48" },
    { medicineId: "MED-0042", from: 96, to: 82, time: "16 Sep, 16:20" },
    { medicineId: "MED-0042", from: 112, to: 96, time: "15 Sep, 11:05" },
  ]);
  function updateStock(medicine: MedicineStock) {
    const previous = medicines.find((item) => item.id === medicine.id)!;
    setChanges((items) => [
      {
        medicineId: medicine.id,
        from: previous.quantity,
        to: medicine.quantity,
        time: "Just now",
      },
      ...items,
    ]);
    setMedicines((items) =>
      items.map((item) => (item.id === medicine.id ? medicine : item))
    );
  }
  return (
    <PharmacyContext.Provider
      value={{
        medicines,
        prescriptions,
        setPrescriptions,
        changes,
        updateStock,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
}
export function usePharmacyDemo() {
  const state = useContext(PharmacyContext);
  if (!state) throw new Error("Pharmacy UI requires PharmacyDemoProvider");
  return state;
}
