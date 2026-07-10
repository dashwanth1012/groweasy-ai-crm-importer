import Link from "next/link";
import { ArrowRight, BrainCircuit, CheckCircle2, DatabaseZap, FileSpreadsheet, ShieldCheck, Upload } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

const workflow = [
  ["01", "Upload CSV", "Drop any valid CSV from ads, CRM exports, spreadsheets, or sales reports."],
  ["02", "Preview Locally", "Parse headers and rows in the browser before any AI call is made."],
  ["03", "Confirm Import", "Send approved rows to the backend in AI-safe batches of 25."],
  ["04", "Export CRM Data", "Review imported and skipped records, then export JSON or clean CSV."]
];

const features = [
  { icon: BrainCircuit, title: "AI field understanding", body: "Gemini maps arbitrary columns into the GrowEasy CRM schema without fixed import templates." },
  { icon: DatabaseZap, title: "Batch resilience", body: "Retries, timeout handling, validation, and partial success support protect large lead lists." },
  { icon: ShieldCheck, title: "Strict CRM output", body: "Statuses, sources, dates, and skipped reasons are validated before returning results." }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="font-display text-xl font-black">
            GrowEasy
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-bold md:flex">
            <Link href="#workflow">Workflow</Link>
            <Link href="#features">Features</Link>
            <Link href="/history">History</Link>
            <Link href="/about">About</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button href="/import" size="sm">
              <Upload className="h-4 w-4" />
              Upload CSV
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-xs font-black uppercase text-muted-foreground">AI-powered CRM lead import</p>
          <h1 className="mt-6 font-display text-[clamp(4rem,9vw,9rem)] font-black leading-[0.84] tracking-normal">
            AI CRM{" "}
            <br />
            IMPORTER
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
            A premium GrowEasy import workflow that reads unknown CSV structures, extracts CRM-ready leads, and preserves every skipped reason.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href="/import" size="lg">
              Upload CSV
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button href="/history" variant="secondary" size="lg">
              View History
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-10 right-0 hidden text-[8rem] font-black leading-none text-border lg:block">AI</div>
          <div className="relative overflow-hidden rounded-[8px] border border-border bg-card shadow-soft">
            <div className="grid grid-cols-[180px_1fr]">
              <div className="border-r border-border p-4">
                <p className="font-display text-lg font-black">GrowEasy</p>
                <div className="mt-6 space-y-2">
                  {["Dashboard", "Generate Leads", "Manage Leads", "Lead Sources"].map((item) => (
                    <div key={item} className={`h-9 rounded-[8px] px-3 py-2 text-xs font-bold ${item === "Lead Sources" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-black">Import Leads via CSV</p>
                    <p className="text-xs text-muted-foreground">Preview first. AI only after confirmation.</p>
                  </div>
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="mt-6 rounded-[8px] border border-dashed border-border p-8 text-center">
                  <Upload className="mx-auto h-10 w-10" />
                  <p className="mt-4 font-black">Drop your CSV file here</p>
                  <p className="mt-1 text-xs text-muted-foreground">or choose a file from your device</p>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {["Rows", "Columns", "Success"].map((label, index) => (
                    <div key={label} className="rounded-[8px] border border-border p-3">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
                      <p className="mt-2 text-xl font-black">{["2,480", "18", "97%"][index]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y border-border py-20">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="font-display text-5xl font-black md:text-7xl">Workflow</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map(([step, title, body]) => (
              <article key={step} className="border-t border-border pt-5">
                <p className="text-sm font-black text-muted-foreground">{step}</p>
                <h3 className="mt-6 text-2xl font-black">{title}</h3>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase text-muted-foreground">Why AI Mapping</p>
            <h2 className="mt-4 font-display text-5xl font-black md:text-7xl">No fixed templates.</h2>
          </div>
          <div className="grid gap-4">
            {features.map((feature) => (
              <article key={feature.title} className="flex gap-5 border-t border-border py-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-card">
                  <feature.icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-2xl font-black">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>GrowEasy AI CRM Importer</p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Built for confident lead operations
          </p>
        </div>
      </footer>
    </main>
  );
}
