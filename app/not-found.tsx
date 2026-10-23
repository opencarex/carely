import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <p className="text-primary text-sm font-semibold tracking-wider">404</p>
      <h1 className="text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <div className="mt-6">
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          Back to home
        </Link>
      </div>
    </main>
  );
}
