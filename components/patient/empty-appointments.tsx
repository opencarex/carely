import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { appContent } from "@/lib/mock/content";
export function EmptyAppointments({ history = false }: { history?: boolean }) {
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
          ? "Completed and cancelled appointments will appear here."
          : "You don't have any scheduled appointments. Find a doctor and choose an available time."}
      </p>
      <Link className={buttonVariants({})} href="/patient/book">
        Book an appointment
      </Link>
      <p className="text-muted-foreground text-sm">
        Need help booking? Contact reception on{" "}
        <a
          className="text-primary underline"
          href={"tel:" + appContent.hospital.phone.replace(/[^+0-9]/g, "")}
        >
          {appContent.hospital.phone}
        </a>
        .
      </p>
    </div>
  );
}
