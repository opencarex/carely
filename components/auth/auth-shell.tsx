import Image from "next/image";
import { Suspense, type ReactNode } from "react";
import { appContent, DEFAULT_HOSPITAL_NAME } from "@/lib/config/content";
import { getHospitalContact } from "@/lib/services/settings";
import { unstable_rethrow } from "next/navigation";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  artwork: {
    alt: string;
    className?: string;
    height: number;
    src: string;
    width: number;
  };
  children: ReactNode;
  compactOnMobile?: boolean;
};

async function HospitalPortalName() {
  try {
    const hospital = await getHospitalContact();
    return `${hospital.name} patient portal`;
  } catch (error) {
    unstable_rethrow(error);
    console.error("Could not load the hospital name for the sign-in screen.");
    return `${DEFAULT_HOSPITAL_NAME} patient portal`;
  }
}

function AuthShell({ artwork, children }: AuthShellProps) {
  return (
    <main className="bg-carely-auth-surface min-h-screen lg:grid lg:grid-cols-5">
      <aside className="bg-primary text-primary-foreground relative flex flex-col justify-between gap-8 p-6 sm:p-10 lg:col-span-2 lg:min-h-screen lg:gap-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex h-12 items-center gap-3">
            <div className="bg-card text-primary grid size-11 place-items-center rounded-lg text-lg font-bold shadow-xs">
              {appContent.brand.initials}
            </div>
            <div className="leading-tight">
              <p className="text-lg font-bold">{appContent.brand.name}</p>
              <p className="text-carely-primary-soft text-xs font-medium">
                {appContent.brand.patientPortal}
              </p>
            </div>
          </div>
        </div>

        {/* Artwork: scales responsively so it never collides with brand or clips on narrow screens */}
        <div className="absolute top-4 right-4 w-20 sm:top-8 sm:right-8 sm:w-28 lg:top-10 lg:right-10 lg:w-31.5">
          <Image
            alt={artwork.alt}
            className={cn(
              "h-auto w-full object-contain drop-shadow-sm",
              artwork.className
            )}
            height={artwork.height}
            priority
            src={artwork.src}
            width={artwork.width}
          />
        </div>

        <div className="my-auto max-w-md space-y-3 py-4 sm:space-y-4 lg:py-0">
          <p className="text-carely-primary-soft text-xs font-semibold tracking-wider">
            CARE, SIMPLIFIED
          </p>
          <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
            Better care, in your hands.
          </h1>
          <p className="text-carely-primary-soft text-sm leading-relaxed font-normal sm:text-base">
            {appContent.portal.description}
          </p>
        </div>

        <div className="bg-carely-primary-deep/90 max-w-md space-y-1.5 rounded-xl border border-white/10 px-4 py-3.5 sm:px-5 sm:py-4">
          <p className="text-sm font-semibold">
            <Suspense fallback={appContent.brand.patientPortal}>
              <HospitalPortalName />
            </Suspense>
          </p>
          <p className="text-carely-primary-soft text-xs leading-relaxed font-normal">
            {appContent.portal.instanceNote}
          </p>
        </div>
      </aside>

      <div className="flex items-center justify-center p-4 sm:p-8 lg:col-span-3 lg:p-12">
        {children}
      </div>
    </main>
  );
}

export { AuthShell };
