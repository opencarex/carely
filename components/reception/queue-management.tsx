"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Panel, StatCards } from "@/components/workspace/workspace-ui";
import { useReceptionDemo } from "@/components/reception/reception-demo-provider";
import { cn } from "@/lib/utils";

export function QueueManagement() {
  const { queues, doctors, updateQueuePatient } = useReceptionDemo();
  const [selectedId, setSelectedId] = useState(queues[0].doctorId);
  const selected = queues.find((item) => item.doctorId === selectedId)!;
  const selectedDoctor = doctors.find((item) => item.id === selectedId)!;
  const waiting = queues.reduce(
    (total, queue) =>
      total + queue.patients.filter((item) => item.status === "Waiting").length,
    0
  );
  const next = selected.patients.find((item) => item.status === "Waiting");
  const [message, setMessage] = useState("");
  return (
    <>
      <StatCards
        metrics={[
          { label: "Waiting patients", value: String(waiting), tone: "blue" },
          { label: "Demo doctor queues", value: String(queues.length), tone: "blue" },
          {
            label: "Average wait",
            value: `${Math.round(queues.reduce((total, item) => total + item.wait, 0) / queues.length)} min`,
            tone: "sky",
          },
          {
            label: "Longest wait",
            value: `${Math.max(...queues.map((item) => item.wait))} min`,
            tone: "amber",
          },
        ]}
      />
      <Dialog>
        <Panel title="Live queues by doctor">
          <div className="space-y-3">
            {queues.map((queue) => {
              const doctor = doctors.find((item) => item.id === queue.doctorId)!;
              return (
                <article
                  key={queue.doctorId}
                  className={cn(
                    "flex flex-col gap-4 rounded-xl p-4 xl:flex-row xl:items-center",
                    queue.delayed ? "bg-amber-50" : "bg-carely-surface"
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar
                      alt={doctor.name}
                      fallback={doctor.name
                        .replace(/^Dr\.\s*/, "")
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    />
                    <div>
                      <h3 className="text-sm font-semibold">{doctor.name}</h3>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {doctor.specialty}
                      </p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-3 gap-3 text-sm xl:min-w-64">
                    <div>
                      <dt className="text-muted-foreground text-xs">Now</dt>
                      <dd className="text-primary mt-1 font-semibold">{queue.serving}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Waiting</dt>
                      <dd className="mt-1">
                        {
                          queue.patients.filter((item) => item.status === "Waiting")
                            .length
                        }
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Wait</dt>
                      <dd className={cn("mt-1", queue.delayed && "text-amber-800")}>
                        {queue.wait} min
                      </dd>
                    </div>
                  </dl>
                  <DialogTrigger
                    render={<Button variant="outline" />}
                    aria-label={`Open queue for ${doctor.name}`}
                    onClick={() => {
                      setSelectedId(queue.doctorId);
                      setMessage("");
                    }}
                  >
                    Open queue
                  </DialogTrigger>
                </article>
              );
            })}
          </div>
        </Panel>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDoctor.name} - Queue</DialogTitle>
            <DialogDescription>
              {selectedDoctor.specialty} &middot; {selectedDoctor.room}. Demo queue
              actions update this reception session.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Now serving <strong>{selected.serving}</strong>
            </p>
            <Button
              disabled={
                !next || selected.patients.some((item) => item.status === "Called")
              }
              onClick={() => {
                if (next) {
                  updateQueuePatient(selectedId, next.id, "Called");
                  setMessage(`${next.token} called.`);
                }
              }}
            >
              Call next
            </Button>
          </div>
          {message && (
            <p role="status" className="text-primary text-sm">
              {message}
            </p>
          )}
          <div className="space-y-3">
            {selected.patients.map((patient) => (
              <article key={patient.id} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {patient.token} &middot; {patient.name}
                  </p>
                  <Badge>{patient.status}</Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Priority: {patient.priority}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {patient.status === "Waiting" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQueuePatient(selectedId, patient.id, "Away")}
                    >
                      Mark away
                    </Button>
                  )}
                  {patient.status === "Away" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateQueuePatient(selectedId, patient.id, "Waiting")
                      }
                    >
                      Rejoin queue
                    </Button>
                  )}
                  {patient.status === "Called" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateQueuePatient(selectedId, patient.id, "Completed")
                      }
                    >
                      Complete visit
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
