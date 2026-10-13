export const nursePatients = [
  {
    id: "P-00155",
    name: "Ananda Fernando",
    condition: "Migraine",
    allergies: "None recorded",
    visits: [
      { id: "APT-1050", label: "Today, 10:45 AM · Dr. A. Fernando" },
      { id: "APT-0991", label: "12 Sep, 09:30 AM · Dr. A. Fernando" },
    ],
  },
  {
    id: "P-00142",
    name: "Saman Perera",
    condition: "Type 2 diabetes",
    allergies: "None recorded",
    visits: [{ id: "APT-1049", label: "Today, 10:30 AM · Dr. Nimal Perera" }],
  },
];

export type NursePatient = (typeof nursePatients)[number];
