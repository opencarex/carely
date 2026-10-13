"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/workspace/workspace-ui";
import { adminRolePermissions } from "@/lib/mock/admin";

export function RolePermissionsForm() {
  const [roles, setRoles] = useState(adminRolePermissions);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  return (
    <Panel title="Role Permissions" className="min-w-0">
      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.role} className="bg-carely-surface rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{role.role}</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {role.permissions
                    .filter((item) => item.enabled)
                    .map((item) => item.label)
                    .join(", ") || "No permissions selected"}
                </p>
              </div>
              <Button
                type="button"
                variant="link"
                size="sm"
                aria-expanded={editing === role.role}
                aria-controls={`permissions-${role.role}`}
                onClick={() => setEditing(editing === role.role ? null : role.role)}
              >
                {editing === role.role ? "Done" : "Edit"}
              </Button>
            </div>
            {editing === role.role && (
              <fieldset
                id={`permissions-${role.role}`}
                className="mt-4 space-y-3 border-t pt-4"
              >
                <legend className="sr-only">{role.role} permissions</legend>
                {role.permissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"
                  >
                    <Checkbox
                      checked={permission.enabled}
                      onCheckedChange={(checked) => {
                        setMessage("");
                        setRoles((previous) =>
                          previous.map((item) =>
                            item.role === role.role
                              ? {
                                  ...item,
                                  permissions: item.permissions.map((option) =>
                                    option.id === permission.id
                                      ? { ...option, enabled: checked }
                                      : option
                                  ),
                                }
                              : item
                          )
                        );
                      }}
                    />
                    {permission.label}
                  </label>
                ))}
              </fieldset>
            )}
          </div>
        ))}
      </div>
      <Button
        className="mt-5 w-full sm:w-auto"
        onClick={() => {
          setEditing(null);
          setMessage(
            "Permissions saved in this demo session. Server-side access rules are not connected yet."
          );
        }}
      >
        Save Permissions
      </Button>
      {message && (
        <p role="status" className="text-primary mt-3 text-sm">
          {message}
        </p>
      )}
    </Panel>
  );
}
