"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Panel } from "@/components/workspace/workspace-ui";
import { adminStaff, staffRoles, type StaffMember } from "@/lib/mock/admin";

export function StaffDirectory() {
  const [staff, setStaff] = useState(adminStaff);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const filtered = staff.filter((item) =>
    `${item.name} ${item.email} ${item.department} ${item.role}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );
  function openEditor(member?: StaffMember) {
    setEditing(
      member
        ? { ...member }
        : { id: "", name: "", email: "", role: "Nurse", department: "", active: true }
    );
    setMessage("");
    setError("");
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const member = {
      ...editing,
      name: editing.name.trim(),
      email: editing.email.trim(),
      department: editing.department.trim(),
    };
    if (!member.name || !member.department) {
      setError("Complete the name and department.");
      return;
    }
    if (
      staff.some(
        (item) =>
          item.id !== member.id && item.email.toLowerCase() === member.email.toLowerCase()
      )
    ) {
      setError("A staff member already uses this email address.");
      return;
    }
    setStaff((previous) =>
      member.id
        ? previous.map((item) => (item.id === member.id ? member : item))
        : [...previous, { ...member, id: crypto.randomUUID() }]
    );
    setEditing(null);
    setMessage("Staff details saved in this demo session.");
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
          <Button onClick={() => openEditor()}>
            <Plus />
            Add staff member
          </Button>
        </div>
      </Card>
      {editing && (
        <Panel title={editing.id ? "Manage staff member" : "Add staff member"}>
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="staff-name"
                label="Full name"
                showLabel
                required
                maxLength={120}
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
              />
              <Input
                id="staff-email"
                label="Email address"
                showLabel
                required
                type="email"
                value={editing.email}
                onChange={(event) =>
                  setEditing({ ...editing, email: event.target.value })
                }
              />
              <div className="space-y-1.5">
                <label htmlFor="staff-role" className="block text-xs font-semibold">
                  Role
                </label>
                <Select
                  value={editing.role}
                  onValueChange={(role) => {
                    if (role) setEditing({ ...editing, role });
                  }}
                >
                  <SelectTrigger id="staff-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                id="staff-department"
                label="Department"
                showLabel
                required
                maxLength={120}
                value={editing.department}
                onChange={(event) =>
                  setEditing({ ...editing, department: event.target.value })
                }
              />
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <Checkbox
                checked={editing.active}
                onCheckedChange={(active) => setEditing({ ...editing, active })}
              />
              Active account
            </label>
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit">Save staff member</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setError("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Panel>
      )}
      {message && (
        <p role="status" className="text-primary text-sm">
          {message}
        </p>
      )}
      <Panel title="Staff directory">
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
                    .join("")}
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{member.name}</h3>
                  <p className="text-muted-foreground mt-1 text-xs break-all">
                    {member.email}
                  </p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm xl:col-span-5">
                <div>
                  <dt className="text-muted-foreground text-xs xl:sr-only">Role</dt>
                  <dd className="mt-1 xl:mt-0">{member.role}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs xl:sr-only">Department</dt>
                  <dd className="mt-1 xl:mt-0">{member.department}</dd>
                </div>
              </dl>
              <div className="flex items-center justify-between gap-3 xl:col-span-3">
                <Badge
                  className={
                    member.active
                      ? "bg-carely-success-soft text-carely-success"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {member.active ? "Active" : "Inactive"}
                </Badge>
                <Button
                  variant="link"
                  size="sm"
                  aria-label={`Manage ${member.name}`}
                  onClick={() => openEditor(member)}
                >
                  Manage
                </Button>
              </div>
            </article>
          ))}
          {!filtered.length && (
            <p role="status" className="text-muted-foreground py-8 text-center text-sm">
              No staff match your search.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}
