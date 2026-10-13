export type MedicineStock = {
  id: string;
  name: string;
  form: string;
  unit: string;
  quantity: number;
  threshold: number;
  batch: string;
  expiry: string;
  updated: string;
};
export const pharmacyMedicines: MedicineStock[] = [
  {
    id: "MED-0041",
    name: "Amoxicillin 500 mg",
    form: "Capsule",
    unit: "capsules",
    quantity: 240,
    threshold: 80,
    batch: "AM-27A",
    expiry: "2027-03-12",
    updated: "17 Sep, 09:40 by A. Silva",
  },
  {
    id: "MED-0042",
    name: "Metformin 500 mg",
    form: "Tablet",
    unit: "tablets",
    quantity: 72,
    threshold: 100,
    batch: "MF-27A",
    expiry: "2027-11-28",
    updated: "17 Sep, 09:48 by A. Silva",
  },
  {
    id: "MED-0043",
    name: "Amlodipine 5 mg",
    form: "Tablet",
    unit: "tablets",
    quantity: 180,
    threshold: 60,
    batch: "AL-28A",
    expiry: "2028-06-15",
    updated: "16 Sep, 11:00 by A. Silva",
  },
  {
    id: "MED-0044",
    name: "Salbutamol inhaler",
    form: "Inhaler",
    unit: "inhalers",
    quantity: 0,
    threshold: 20,
    batch: "",
    expiry: "",
    updated: "17 Sep, 08:45 by A. Silva",
  },
  {
    id: "MED-0045",
    name: "Atorvastatin 20 mg",
    form: "Tablet",
    unit: "tablets",
    quantity: 96,
    threshold: 40,
    batch: "AT-27A",
    expiry: "2027-01-09",
    updated: "16 Sep, 15:00 by A. Silva",
  },
  {
    id: "MED-0046",
    name: "Paracetamol 500 mg",
    form: "Tablet",
    unit: "tablets",
    quantity: 620,
    threshold: 200,
    batch: "PA-28B",
    expiry: "2028-08-21",
    updated: "17 Sep, 09:00 by A. Silva",
  },
];
export type PharmacyPrescription = {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  department: string;
  issued: string;
  status: "Pending" | "Dispensed" | "Cancelled";
  medicines: {
    medicineId: string;
    directions: string;
    duration: string;
    required: number;
  }[];
};
export const pharmacyPrescriptions: PharmacyPrescription[] = [
  {
    id: "RX-00182",
    patientId: "P-00142",
    patientName: "Saman Perera",
    doctor: "Dr. A. Perera",
    department: "Cardiology",
    issued: "17 Sep, 10:45 AM",
    status: "Pending",
    medicines: [
      {
        medicineId: "MED-0042",
        directions: "1 tablet, twice daily",
        duration: "30 days",
        required: 60,
      },
      {
        medicineId: "MED-0043",
        directions: "1 tablet, once daily",
        duration: "30 days",
        required: 30,
      },
    ],
  },
  {
    id: "RX-00183",
    patientId: "P-00143",
    patientName: "Kumari Silva",
    doctor: "Dr. Kumari Silva",
    department: "Respiratory",
    issued: "17 Sep, 11:00 AM",
    status: "Pending",
    medicines: [
      {
        medicineId: "MED-0044",
        directions: "Use as prescribed by the doctor",
        duration: "See prescription",
        required: 1,
      },
    ],
  },
  {
    id: "RX-00179",
    patientId: "P-00155",
    patientName: "Ananda Fernando",
    doctor: "Dr. A. Fernando",
    department: "General Medicine",
    issued: "16 Sep, 10:00 AM",
    status: "Dispensed",
    medicines: [
      {
        medicineId: "MED-0046",
        directions: "As directed by the doctor",
        duration: "5 days",
        required: 10,
      },
    ],
  },
  {
    id: "RX-00176",
    patientId: "P-00160",
    patientName: "Nimal Jayawardena",
    doctor: "Dr. Nimal Perera",
    department: "Cardiology",
    issued: "16 Sep, 09:30 AM",
    status: "Cancelled",
    medicines: [
      {
        medicineId: "MED-0045",
        directions: "1 tablet, once daily",
        duration: "30 days",
        required: 30,
      },
    ],
  },
];
export function stockStatus(medicine: MedicineStock) {
  return medicine.quantity === 0
    ? "Out of stock"
    : medicine.quantity < medicine.threshold
      ? "Low stock"
      : "In stock";
}
export function displayExpiry(expiry: string) {
  if (!expiry) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${expiry}T00:00:00Z`));
}
