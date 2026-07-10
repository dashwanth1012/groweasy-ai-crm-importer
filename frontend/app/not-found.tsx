import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="max-w-xl text-center">
        <p className="text-sm font-semibold uppercase text-muted-foreground">404</p>
        <h1 className="mt-4 font-display text-5xl font-black tracking-normal md:text-7xl">Page Not Found</h1>
        <p className="mt-5 text-muted-foreground">The page you opened is outside the GrowEasy import workspace.</p>
        <Button asChild className="mt-8">
          <Link href="/import">
            <ArrowLeft className="h-4 w-4" />
            Back to importer
          </Link>
        </Button>
      </section>
    </main>
  );
}

