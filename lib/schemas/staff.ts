import { z } from "zod";

export const staffRoleEnum = z.enum([
  "doctor",
  "nurse",
  "pharmacist",
  "receptionist",
]);
export type StaffRole = z.infer<typeof staffRoleEnum>;

export const createStaffSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(120, "Name must not exceed 120 characters"),
    email: z.email("Please provide a valid email address"),
    role: staffRoleEnum,
    department: z
      .string()
      .trim()
      .max(120, "Department must not exceed 120 characters")
      .optional(),
    specialtyId: z
      .string()
      .uuid("Invalid specialty identifier")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.role === "doctor" && (!data.specialtyId || data.specialtyId.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "Medical specialty is required when adding a doctor",
      path: ["specialtyId"],
    }
  );

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffStatusSchema = z.object({
  active: z.boolean(),
});

export type UpdateStaffStatusInput = z.infer<typeof updateStaffStatusSchema>;

export interface StaffListItem {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  department: string;
  active: boolean;
  inviteStatus: "pending" | "claimed";
  specialty?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}
