import { demoPeople } from "@/lib/mock/content";
import { finderDoctors, visitReasons } from "@/lib/mock/admin";

// Frozen design fixtures, not live availability or clinical records.
export const patientVisitReasons = visitReasons.filter((reason) => reason.active);
export const patientDoctors = finderDoctors
  .filter((doctor) => doctor.active)
  .map((doctor) => ({
    ...doctor,
    initials: doctor.name
      .replace("Dr. ", "")
      .split(" ")
      .map((part) => part[0])
      .join(""),
    room: doctor.id === "DOC-03" ? "OPD Room 04" : "OPD Room 02",
    dates:
      doctor.id === "DOC-04"
        ? ["2026-10-13", "2026-10-14"]
        : ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-26"],
    times:
      doctor.id === "DOC-04"
        ? ["08:45 AM", "09:15 AM", "09:45 AM"]
        : ["09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM"],
  }));
export type PatientDoctor = (typeof patientDoctors)[number];
export type PatientAppointment = {
  id: string;
  doctorId: string;
  date: string;
  time: string;
  status: "Confirmed" | "Cancelled" | "Completed";
};
export const patientAppointments: PatientAppointment[] = [
  {
    id: "APT-1048",
    doctorId: "DOC-03",
    date: "2026-10-12",
    time: "09:30 AM",
    status: "Confirmed",
  },
  {
    id: "APT-1026",
    doctorId: "DOC-02",
    date: "2026-10-26",
    time: "11:00 AM",
    status: "Confirmed",
  },
  {
    id: "APT-0982",
    doctorId: "DOC-03",
    date: "2026-10-04",
    time: "10:00 AM",
    status: "Completed",
  },
];
export function formatPatientDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
}

export const defaultPatientProfile = {
  fullName: demoPeople.portalPatient.name,
  dateOfBirth: "2001-05-18",
  email: demoPeople.portalPatient.email,
  phone: "+94 77 123 4567",
  gender: "Female",
  address: demoPeople.portalPatient.address,
  emergencyContact: "Nimal Silva (Father) / +94 71 987 6543",
};
export type PatientProfileData = typeof defaultPatientProfile;

export const patientMedicines = [
  {
    code: "AM",
    name: "Amoxicillin",
    form: "500 mg capsule",
    dose: "1 capsule · three times daily",
    note: "Take after meals · 5 days",
  },
  {
    code: "PA",
    name: "Paracetamol",
    form: "500 mg tablet",
    dose: "2 tablets · when required",
    note: "Maximum 3 times per day",
  },
  {
    code: "OM",
    name: "Omeprazole",
    form: "20 mg capsule",
    dose: "1 capsule · once daily",
    note: "Take before breakfast · 7 days",
  },
] as const;

export function comparePatientAppointments(a: PatientAppointment, b: PatientAppointment) {
  const minutes = (time: string) => {
    const [hours, minute, period] = time.split(/[: ]/);
    return ((Number(hours) % 12) + (period === "PM" ? 12 : 0)) * 60 + Number(minute);
  };
  return a.date.localeCompare(b.date) || minutes(a.time) - minutes(b.time);
}
