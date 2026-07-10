import { BrainCircuit, Code2, LayoutDashboard } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export default function AboutPage() {
  return (
    <AppShell>
      <section className="min-h-screen px-4 py-6 md:px-8 xl:px-10">
        <div className="mx-auto max-w-[1080px]">
          <p className="text-xs font-black uppercase text-muted-foreground">About</p>
          <h1 className="mt-1 font-display text-3xl font-black md:text-6xl">Built for arbitrary CSVs.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            GrowEasy AI CRM Importer separates preview, confirmation, backend batch processing, prompt engineering, validation,
            and export so teams can turn messy lead files into CRM-ready records with confidence.
          </p>

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <Pillar icon={<LayoutDashboard className="h-6 w-6" />} title="Product UX" body="A calm CRM workspace with modal upload, dark mode, responsive tables, empty states, and keyboard access." />
            <Pillar icon={<BrainCircuit className="h-6 w-6" />} title="AI Mapping" body="Gemini interprets semantic fields, preserves notes, skips invalid rows, and keeps output aligned to the CRM schema." />
            <Pillar icon={<Code2 className="h-6 w-6" />} title="Reliable Processing" body="Clean service boundaries, validation, retries, request tracing, and import history keep the workflow dependable." />
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Pillar({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <article className="border-t border-border pt-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-card">{icon}</div>
      <h2 className="mt-6 text-2xl font-black">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
    </article>
  );
}
