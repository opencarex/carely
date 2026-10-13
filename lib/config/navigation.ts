import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  ClipboardPenLine,
  ClipboardPlus,
  LayoutDashboard,
  ListOrdered,
  NotebookPen,
  PackageOpen,
  PackageSearch,
  Pill,
  ScrollText,
  Search,
  Settings,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";

export type NavItem = { href: string; icon: LucideIcon; label: string };

export const roleNavigation: Record<string, NavItem[]> = {
  patient: [
    { label: "Dashboard", href: "/patient", icon: LayoutDashboard },
    { label: "Find a Doctor", href: "/patient/book", icon: Search },
    { label: "Appointments", href: "/patient/appointments", icon: CalendarDays },
    { label: "Live Queue", href: "/patient/queue", icon: ListOrdered },
    { label: "Prescriptions", href: "/patient/prescriptions", icon: Pill },
    { label: "Profile", href: "/patient/profile", icon: UserRound },
  ],
  doctor: [
    { label: "Dashboard", href: "/doctor", icon: LayoutDashboard },
    { label: "Patients", href: "/doctor/patients", icon: Users },
    { label: "Clinical Notes", href: "/doctor/notes", icon: ClipboardPenLine },
    { label: "Availability", href: "/doctor/availability", icon: CalendarClock },
  ],
  nurse: [
    { label: "Record Vitals", href: "/nurse/vitals", icon: ClipboardPlus },

    {
      label: "Preliminary Records",
      href: "/nurse/preliminary-records",
      icon: NotebookPen,
    },
  ],
  reception: [
    { label: "Walk-in Registration", href: "/reception/register", icon: UserPlus },
    { label: "On-site Channeling", href: "/reception/channeling", icon: CalendarPlus },
    { label: "Queue Management", href: "/reception/queue", icon: ListOrdered },
  ],
  pharmacy: [
    { label: "Inventory", href: "/pharmacy", icon: PackageSearch },
    { label: "Edit Stock", href: "/pharmacy/stock", icon: PackageOpen },
    { label: "Stock Requests", href: "/pharmacy/requests", icon: ClipboardList },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Staff Management", href: "/admin/staff", icon: Users },
    { label: "System Settings", href: "/admin/settings", icon: Settings },
    { label: "Audit Trail", href: "/admin/audit", icon: ScrollText },
  ],
};
