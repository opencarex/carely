"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Mail, Plus, UserCheck, UserX } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel } from "@/components/workspace/workspace-ui";
import {
  createStaffSchema,
  type CreateStaffInput,
  type StaffListItem,
  type StaffRole,
} from "@/lib/schemas/staff";

interface SpecialtyOption {
  id: string;
  name: string;
}

const AVAILABLE_ROLES: { value: StaffRole; label: string }[] = [
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "receptionist", label: "Receptionist" },
];

export function StaffDirectory() {
  const [staff, setStaff] = useState<StaffListItem[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // React Hook Form with Zod validation
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffInput>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "nurse",
      department: "",
      specialtyId: "",
    },
  });

  const selectedRole = watch("role");

  const roleItems = AVAILABLE_ROLES.map((r) => ({
    value: r.value,
    label: r.label,
  }));

  const specialtyItems = specialties.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  // Load initial data from APIs
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, specialtiesRes] = await Promise.all([
        fetch("/api/admin/staff"),
        fetch("/api/admin/specialties"),
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData.staff || []);
      }

      if (specialtiesRes.ok) {
        const specialtiesData = await specialtiesRes.json();
        setSpecialties(specialtiesData.specialties || []);
      }
    } catch {
      setError("Failed to fetch staff directory from server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = staff.filter((item) =>
    `${item.name} ${item.email} ${item.department} ${item.role}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  function openAddModal() {
    reset({
      name: "",
      email: "",
      role: "nurse",
      department: "",
      specialtyId: specialties[0]?.id || "",
    });
    setMessage("");
    setError("");
    setShowAddForm(true);
  }

  const handleCreateStaff = async (values: CreateStaffInput) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create staff member.");
        return;
      }

      setMessage(data.message || "Staff member created successfully!");
      setShowAddForm(false);
      reset();
      await loadData();
    } catch {
      setError("Network error while creating staff member.");
    }
  };

  async function handleToggleStatus(member: StaffListItem) {
    setError("");
    setMessage("");
    setActionLoadingId(member.id);

    try {
      const response = await fetch(`/api/admin/staff/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !member.active }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to update staff status.");
        return;
      }

      setStaff((prev) =>
        prev.map((item) =>
          item.id === member.id ? { ...item, active: !member.active } : item
        )
      );
      setMessage(
        `Staff member "${member.name}" marked as ${!member.active ? "active" : "inactive"}.`
      );
    } catch {
      setError("Failed to update staff status.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleResendInvite(member: StaffListItem) {
    setError("");
    setMessage("");
    setActionLoadingId(member.id);

    try {
      const response = await fetch(`/api/admin/staff/${member.id}/resend-invite`, {
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to resend invite.");
        return;
      }

      setMessage(`Invitation email resent to ${member.email}.`);
    } catch {
      setError("Network error while resending invitation.");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Input
              id="staff-search"
              label="Search staff"
              showLabel
              placeholder="Search staff by name, email or department"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              controlSize="compact"
            />
          </div>
          <Button onClick={openAddModal}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add staff member
          </Button>
        </div>
      </Card>

      {message && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
        >
          {error}
        </div>
      )}

      {showAddForm && (
        <Panel title="Add New Staff Member">
          <form onSubmit={handleSubmit(handleCreateStaff)} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="new-staff-name"
                label="Full name"
                showLabel
                maxLength={120}
                placeholder="e.g. Dr. Kasun Bandara"
                disabled={isSubmitting}
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                id="new-staff-email"
                label="Hospital email address"
                showLabel
                type="email"
                placeholder="e.g. k.bandara@carely.local"
                disabled={isSubmitting}
                error={errors.email?.message}
                {...register("email")}
              />

              <div className="space-y-1.5">
                <label htmlFor="new-staff-role" className="block text-xs font-semibold">
                  Role
                </label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      items={roleItems}
                      value={field.value}
                      onValueChange={(val) => {
                        if (val) field.onChange(val as StaffRole);
                      }}
                    >
                      <SelectTrigger id="new-staff-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && (
                  <p className="text-destructive text-xs">{errors.role.message}</p>
                )}
              </div>

              {selectedRole === "doctor" ? (
                <div className="space-y-1.5">
                  <label htmlFor="new-staff-specialty" className="block text-xs font-semibold">
                    Medical Specialty <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    name="specialtyId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        items={specialtyItems}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="new-staff-specialty">
                          <SelectValue placeholder="Select specialty">
                            {(val) =>
                              specialties.find((s) => s.id === val)?.name ||
                              "Select specialty"
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {specialties.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.specialtyId && (
                    <p className="text-destructive text-xs">
                      {errors.specialtyId.message}
                    </p>
                  )}
                </div>
              ) : (
                <Input
                  id="new-staff-dept"
                  label="Department"
                  showLabel
                  maxLength={120}
                  placeholder={
                    selectedRole === "nurse"
                      ? "e.g. OPD / Emergency"
                      : selectedRole === "receptionist"
                        ? "e.g. Main Lobby"
                        : "e.g. Inpatient Pharmacy"
                  }
                  disabled={isSubmitting}
                  error={errors.department?.message}
                  {...register("department")}
                />
              )}
            </div>

            <p className="text-muted-foreground text-xs">
              <strong>Zero-Knowledge Security:</strong> You do not need to create a temporary password.
              An activation invitation will be dispatched automatically to the staff member&apos;s email.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving &amp; Dispatching Invite...
                  </>
                ) : (
                  "Create Staff & Send Invite"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  setShowAddForm(false);
                  reset();
                  setError("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel title="Staff Directory">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
            Loading hospital staff...
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((member) => (
              <article
                key={member.id}
                className="bg-carely-surface flex flex-col gap-4 rounded-xl p-4 xl:grid xl:grid-cols-12 xl:items-center"
              >
                <div className="flex min-w-0 items-center gap-3 xl:col-span-4">
                  <Avatar
                    alt={member.name}
                    fallback={member.name
                      .replace(/^Dr\.\s*/, "")
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase() || "ST"}
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{member.name}</h3>
                    <p className="text-muted-foreground mt-0.5 text-xs break-all">
                      {member.email}
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm xl:col-span-4">
                  <div>
                    <dt className="text-muted-foreground text-xs xl:sr-only">Role</dt>
                    <dd className="mt-1 font-medium capitalize xl:mt-0">
                      {member.role}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs xl:sr-only">Department</dt>
                    <dd className="mt-1 xl:mt-0">{member.department}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center justify-between gap-3 xl:col-span-4 xl:justify-end">
                  {!member.active ? (
                    <Badge className="bg-slate-100 text-slate-600">
                      Inactive
                    </Badge>
                  ) : member.inviteStatus === "pending" ? (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                      Pending Invite
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      Active
                    </Badge>
                  )}

                  <div className="flex items-center gap-2">
                    {member.active && member.inviteStatus === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoadingId === member.id}
                        onClick={() => handleResendInvite(member)}
                        title="Resend invitation email"
                      >
                        {actionLoadingId === member.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Mail className="mr-1.5 h-3.5 w-3.5" />
                            Resend
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoadingId === member.id}
                      onClick={() => handleToggleStatus(member)}
                      title={member.active ? "Deactivate account" : "Re-activate account"}
                    >
                      {actionLoadingId === member.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : member.active ? (
                        <>
                          <UserX className="mr-1.5 h-3.5 w-3.5" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </article>
            ))}

            {!filtered.length && (
              <p role="status" className="text-muted-foreground py-8 text-center text-sm">
                No staff members found matching your search.
              </p>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
