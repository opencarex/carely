"use client";

import Image from "next/image";
import { patientMedicines } from "@/lib/mock/patient";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PrescriptionMedicine } from "@/components/patient/prescription-medicine";
import { Card } from "@/components/ui/card";
import {
  FactCard,
  InitialAvatar,
  StatusBadge,
} from "@/components/patient/patient-shared";
import { PrintPrescriptionButton } from "@/components/workspace/print-prescription-button";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { appContent, demoPeople } from "@/lib/mock/content";

export default function PatientPrescriptionsPage() {
  const [history, setHistory] = useState(false);
  return (
    <>
      <PageTitle
        eyebrow="My medication"
        title="Prescriptions"
        description="Review prescriptions issued by your doctor and their dispensing status."
        action={
          <Image
            src="/images/prescription.svg"
            alt={`${appContent.brand.name} prescription assistant`}
            width={70}
            height={96}
            priority
          />
        }
      />

      <div className="mb-5 flex gap-2" aria-label="Prescription filters">
        <Button
          variant={!history ? "default" : "outline"}
          aria-pressed={!history}
          onClick={() => setHistory(false)}
        >
          Pending (1)
        </Button>
        <Button
          variant={history ? "default" : "outline"}
          aria-pressed={history}
          onClick={() => setHistory(true)}
        >
          History
        </Button>
      </div>

      {history ? (
        <Card className="p-6">
          <h2 className="font-semibold">No prescription history yet</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Dispensed prescriptions will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold sm:text-lg">
                  Prescription RX-2026-184
                </h2>
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                  Issued 04 Oct 2026 · {demoPeople.primaryDoctor.name}
                </p>
              </div>
              <StatusBadge tone="green">Pending</StatusBadge>
            </div>

            <div className="space-y-3">
              {patientMedicines.map((med) => (
                <PrescriptionMedicine key={med.code} item={med} />
              ))}
            </div>

            <div className="mt-2 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
              <InitialAvatar>!</InitialAvatar>
              <p>
                Follow the doctor&apos;s instructions carefully. Contact the hospital if
                the prescription is unclear or you experience an adverse reaction.
              </p>
            </div>
          </Card>

          <Card className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
            <h2 className="text-base font-semibold">Prescription summary</h2>

            <div className="min-h-24 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Medicines
                </p>
                <StatusBadge tone="green">Pending</StatusBadge>
              </div>
              <p className="mt-1 text-2xl font-bold">3</p>
            </div>

            <div className="min-h-24 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Prescribed on
                </p>
                <StatusBadge tone="blue">Issued</StatusBadge>
              </div>
              <p className="mt-1 text-2xl font-bold">04 Oct</p>
            </div>

            <FactCard
              label="Prescribed by"
              value={`${demoPeople.primaryDoctor.name} · Cardiology · ${appContent.hospital.name}`}
            />

            <PrintPrescriptionButton />

            <p className="text-muted-foreground text-xs leading-relaxed">
              For medicine availability and collection, contact the hospital pharmacy.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
