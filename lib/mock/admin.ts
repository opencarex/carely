import { appContent } from "@/lib/mock/content";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  active: boolean;
};
export const staffRoles = [
  "Doctor",
  "Nurse",
  "Pharmacist",
  "Receptionist",
  "Administrator",
];
export const adminStaff: StaffMember[] = [
  {
    id: "U-0081",
    name: "Dr. Nimal Perera",
    email: "nimal.perera@example.com",
    role: "Doctor",
    department: "Cardiology",
    active: true,
  },
  {
    id: "U-0082",
    name: "N. Fernando",
    email: "n.fernando@example.com",
    role: "Nurse",
    department: "OPD",
    active: true,
  },
  {
    id: "U-0083",
    name: "A. Silva",
    email: "a.silva@example.com",
    role: "Pharmacist",
    department: "Pharmacy",
    active: true,
  },
  {
    id: "U-0084",
    name: "M. Perera",
    email: "m.perera@example.com",
    role: "Receptionist",
    department: "Front desk",
    active: true,
  },
  {
    id: "U-0085",
    name: "Dr. A. Fernando",
    email: "a.fernando@example.com",
    role: "Doctor",
    department: "General Medicine",
    active: false,
  },
  {
    id: "U-0086",
    name: "S. Jayasinghe",
    email: "s.jayasinghe@example.com",
    role: "Nurse",
    department: "Emergency",
    active: true,
  },
];
export const hospitalDetails = {
  name: appContent.hospital.name,
  address: "Negombo, Sri Lanka",
  phone: appContent.hospital.phone,
  email: "reception@example.com",
};
export type RolePermission = {
  role: string;
  permissions: { id: string; label: string; enabled: boolean }[];
};
export const adminRolePermissions: RolePermission[] = [
  {
    role: "Doctor",
    permissions: [
      { id: "clinical-records", label: "Clinical records", enabled: true },
      { id: "prescriptions", label: "Prescriptions", enabled: true },
      { id: "availability", label: "Availability", enabled: true },
    ],
  },
  {
    role: "Nurse",
    permissions: [
      { id: "vitals", label: "Vitals", enabled: true },
      { id: "preliminary-records", label: "Preliminary records", enabled: true },
    ],
  },
  {
    role: "Receptionist",
    permissions: [
      { id: "registration", label: "Registration", enabled: true },
      { id: "appointments", label: "Appointments", enabled: true },
      { id: "queue", label: "Queue", enabled: true },
    ],
  },
  {
    role: "Pharmacist",
    permissions: [
      { id: "inventory", label: "Inventory", enabled: true },
      { id: "dispensing", label: "Prescription dispensing", enabled: true },
    ],
  },
];
export type VisitReason = { id: string; label: string; active: boolean };
export type FinderDoctor = {
  id: string;
  name: string;
  specialty: string;
  active: boolean;
  reasonIds: string[];
};
export const visitReasons: VisitReason[] = [
  { id: "general", label: "General consultation", active: true },
  { id: "follow-up", label: "Follow-up visit", active: true },
  { id: "skin", label: "Skin concerns", active: true },
  { id: "joint", label: "Joint pain", active: true },
  { id: "heart", label: "Heart follow-up", active: true },
];
export const finderDoctors: FinderDoctor[] = [
  {
    id: "DOC-01",
    name: "Dr. A. Fernando",
    specialty: "General Medicine",
    active: true,
    reasonIds: ["general", "follow-up"],
  },
  {
    id: "DOC-02",
    name: "Dr. Samadhi Peris",
    specialty: "General Medicine",
    active: true,
    reasonIds: ["general", "follow-up"],
  },
  {
    id: "DOC-03",
    name: "Dr. Nimal Perera",
    specialty: "Cardiology",
    active: true,
    reasonIds: ["heart"],
  },
  {
    id: "DOC-04",
    name: "Dr. Ruwan Fernando",
    specialty: "Dermatology",
    active: true,
    reasonIds: ["skin"],
  },
];
export const adminRecentActivity = [
  { time: "10:18", role: "Receptionist", description: "Registered patient P-0182" },
  { time: "10:12", role: "Doctor", description: "Signed clinical note for P-0142" },
  { time: "10:06", role: "Pharmacist", description: "Updated Metformin stock" },
  { time: "09:42", role: "Admin", description: "Activated staff account" },
];
export type AuditCategory = "Patient" | "Clinical" | "Inventory" | "Security";
export type AuditEntry = {
  id: string;
  date: string;
  time: string;
  action: string;
  description: string;
  actor: string;
  actorRole: string;
  resource: string;
  department: string;
  category: AuditCategory;
};
export const adminAuditEntries: AuditEntry[] = [
  {
    id: "EVT-01882",
    date: "2026-09-17",
    time: "10:18:42",
    action: "PATIENT_CREATE",
    description: "Created a new patient record",
    actor: "M. Perera",
    actorRole: "Receptionist",
    resource: "P-0182",
    department: "Front Desk",
    category: "Patient",
  },
  {
    id: "EVT-01881",
    date: "2026-09-17",
    time: "10:12:08",
    action: "CLINICAL_NOTE_SIGN",
    description: "Signed and locked a clinical note",
    actor: "Dr. Nimal Perera",
    actorRole: "Doctor",
    resource: "P-0142",
    department: "Cardiology",
    category: "Clinical",
  },
  {
    id: "EVT-01880",
    date: "2026-09-17",
    time: "10:06:31",
    action: "STOCK_UPDATE",
    description: "Updated medicine stock quantity",
    actor: "A. Silva",
    actorRole: "Pharmacist",
    resource: "MED-0042",
    department: "Pharmacy",
    category: "Inventory",
  },
  {
    id: "EVT-01879",
    date: "2026-09-17",
    time: "09:54:12",
    action: "ALERT_ESCALATE",
    description: "Escalated a patient priority alert",
    actor: "N. Fernando",
    actorRole: "Nurse",
    resource: "P-0161",
    department: "OPD",
    category: "Clinical",
  },
  {
    id: "EVT-01878",
    date: "2026-09-17",
    time: "09:42:55",
    action: "STAFF_STATUS_CHANGE",
    description: "Activated a staff account",
    actor: "System Admin",
    actorRole: "Administrator",
    resource: "U-0084",
    department: "Admin",
    category: "Security",
  },
  {
    id: "EVT-01877",
    date: "2026-09-17",
    time: "09:31:16",
    action: "AI_RECAP_REVIEW",
    description: "Reviewed a historical consultation recap",
    actor: "Dr. Nimal Perera",
    actorRole: "Doctor",
    resource: "P-0142",
    department: "Cardiology",
    category: "Clinical",
  },
];
