export type ReceptionPatient = {
  id: string;
  name: string;
  dob: string;
  phone: string;
  address: string;
  lastVisit: string;
};
export const receptionPatients: ReceptionPatient[] = [
  {
    id: "P-00142",
    name: "Saman Perera",
    dob: "1968-05-14",
    phone: "077 123 4567",
    address: "Negombo, Sri Lanka",
    lastVisit: "12 Sep - Cardiology",
  },
  {
    id: "P-00168",
    name: "Kavindi Silva",
    dob: "1996-04-20",
    phone: "077 234 5678",
    address: "24 Lake Road, Negombo",
    lastVisit: "05 Sep - Cardiology",
  },
  {
    id: "P-00155",
    name: "Ananda Fernando",
    dob: "1979-02-10",
    phone: "077 345 6789",
    address: "Negombo, Sri Lanka",
    lastVisit: "12 Sep - General Medicine",
  },
];
export type ReceptionDoctor = {
  id: string;
  name: string;
  specialty: string;
  next: string;
  slots: number;
  room: string;
  prefix: string;
};
export const receptionDoctors: ReceptionDoctor[] = [
  {
    id: "DOC-01",
    name: "Dr. Nimal Perera",
    specialty: "Cardiology",
    next: "10:30",
    slots: 2,
    room: "OPD Room 04",
    prefix: "C",
  },
  {
    id: "DOC-02",
    name: "Dr. A. Fernando",
    specialty: "General Medicine",
    next: "10:45",
    slots: 4,
    room: "OPD Room 02",
    prefix: "G",
  },
  {
    id: "DOC-03",
    name: "Dr. Kumari Silva",
    specialty: "Respiratory",
    next: "11:00",
    slots: 1,
    room: "OPD Room 03",
    prefix: "R",
  },
  {
    id: "DOC-04",
    name: "Dr. R. Jayasinghe",
    specialty: "General Medicine",
    next: "11:30",
    slots: 3,
    room: "OPD Room 05",
    prefix: "G",
  },
  {
    id: "DOC-05",
    name: "Dr. S. Perera",
    specialty: "Pediatrics",
    next: "12:00",
    slots: 0,
    room: "OPD Room 01",
    prefix: "P",
  },
];
export type ReceptionBooking = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  date: string;
  time: string;
  status: "Booked" | "Checked in" | "Cancelled";
  token?: string;
};
export const receptionBookings: ReceptionBooking[] = [
  {
    id: "APT-1048",
    patientId: "P-00168",
    patientName: "Kavindi Silva",
    doctorId: "DOC-01",
    date: "2026-10-12",
    time: "09:30",
    status: "Booked",
  },
  {
    id: "APT-1049",
    patientId: "P-00142",
    patientName: "Saman Perera",
    doctorId: "DOC-01",
    date: "2026-10-12",
    time: "10:30",
    status: "Checked in",
    token: "C-16",
  },
  {
    id: "APT-1050",
    patientId: "P-00155",
    patientName: "Ananda Fernando",
    doctorId: "DOC-02",
    date: "2026-10-12",
    time: "10:45",
    status: "Booked",
  },
  {
    id: "APT-1047",
    patientId: "P-00168",
    patientName: "Kavindi Silva",
    doctorId: "DOC-03",
    date: "2026-10-12",
    time: "09:00",
    status: "Cancelled",
  },
];
export type QueuePatient = {
  id: string;
  name: string;
  token: string;
  priority: "Normal" | "Urgent";
  status: "Waiting" | "Called" | "Away" | "Completed";
};
export type DoctorQueue = {
  doctorId: string;
  serving: string;
  wait: number;
  delayed: boolean;
  patients: QueuePatient[];
};
export const receptionQueues: DoctorQueue[] = receptionDoctors.map((doctor, index) => ({
  doctorId: doctor.id,
  serving: ["C-15", "G-09", "R-07", "G-14", "P-06"][index],
  wait: [25, 18, 16, 44, 13][index],
  delayed: index === 3,
  patients: Array.from({ length: [8, 6, 5, 9, 4][index] }, (_, offset) => ({
    id: `${doctor.id}-P-${offset}`,
    name: [
      "Saman Perera",
      "Kumari Silva",
      "Ananda Fernando",
      "Nimal Jayawardena",
      "Shalini De Silva",
      "Ruwan Bandara",
      "Kavindi Silva",
      "N. Fernando",
      "A. Silva",
    ][offset],
    token: `${doctor.prefix}-${[16, 10, 8, 15, 7][index] + offset}`,
    priority: offset === 1 ? "Urgent" : "Normal",
    status: "Waiting",
  })),
}));
