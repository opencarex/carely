import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
export function EmptyAppointments({
  history,
  hospitalPhone,
}: {
  history: boolean;
  hospitalPhone: string | null;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center sm:py-12">
      <Image
        src="/images/empty-appointments.svg"
        alt="Carely calendar assistant"
        width={126}
        height={151}
      />
      <h2 className="text-xl font-bold">
        {history ? "No past appointments" : "No appointments yet"}
      </h2>
      <p className="text-muted-foreground max-w-lg text-sm">
        {history
          ? "Past, completed, and cancelled appointments will appear here."
          : "You don't have any scheduled appointments. Find a doctor and choose an available clinic date."}
      </p>
      <Link className={buttonVariants({})} href="/patient/book">
        Book an appointment
      </Link>
      <p className="text-muted-foreground text-sm">
        Need help booking? Contact reception
        {hospitalPhone && (
          <>
            {" "}
            on{" "}
            <a
              className="text-primary underline"
              href={"tel:" + hospitalPhone.replace(/[^+0-9]/g, "")}
            >
              {hospitalPhone}
            </a>
          </>
        )}
        .
      </p>
    </div>
  );
}
