"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ChevronsRight,
  FileSpreadsheet,
  LayoutDashboard,
  Megaphone,
  Phone,
  Radio,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Workflow
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

const mainNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/import", label: "Generate Leads", icon: Rocket },
  { href: "/history", label: "Manage Leads", icon: FileSpreadsheet },
  { href: "/about", label: "Engage Leads", icon: Megaphone }
];

const controlNav = [
  { href: "/team-members", label: "Team Members", icon: Users },
  { href: "/lead-sources", label: "Lead Sources", icon: Radio },
  { href: "/ad-accounts", label: "Ad Accounts", icon: BarChart3 },
  { href: "/whatsapp", label: "WhatsApp Account", icon: ShieldCheck },
  { href: "/tele-calling", label: "Tele Calling", icon: Phone },
  { href: "/crm-fields", label: "CRM Fields", icon: Workflow },
  { href: "/api-center", label: "API Center", icon: Upload }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[286px] border-r border-border bg-card/80 backdrop-blur xl:block">
        <div className="flex h-full flex-col px-5 py-6">
          <Link href="/" className="flex items-center gap-3 font-display text-xl font-black">
            <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-foreground text-background">
              <ChevronsRight className="h-5 w-5" />
            </span>
            GrowEasy
          </Link>

          <Link href="/settings" className="focus-ring mt-6 flex items-center justify-between rounded-[8px] border border-border bg-background px-3 py-3 text-left">
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[7px] bg-accent text-accent-foreground">
                <Building2 className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold">Test Corp</span>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Owner</span>
              </span>
            </span>
            <ChevronsRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <NavGroup title="Main" items={mainNav} pathname={pathname} />
          <NavGroup title="Control Center" items={controlNav} pathname={pathname} />

          <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
            <Link href="/settings" className="focus-ring flex items-center gap-2 rounded-[8px] px-2 py-2 text-sm font-bold">
              <Sparkles className="h-4 w-4" />
              Business Center
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-border bg-background/85 px-4 py-3 backdrop-blur xl:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-black">
            <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-foreground text-background">
              <ChevronsRight className="h-4 w-4" />
            </span>
            GrowEasy
          </Link>
          <ThemeToggle />
        </div>
        <nav className="scrollbar-soft mt-3 flex gap-2 overflow-x-auto pb-1">
          {[...mainNav, { href: "/settings", label: "Settings", icon: Settings }].map((item) => (
            <MobileNavItem key={`${item.href}-${item.label}`} item={item} active={pathname === item.href} />
          ))}
        </nav>
      </header>

      <main className="xl:pl-[286px]">{children}</main>
    </div>
  );
}

function NavGroup({
  title,
  items,
  pathname
}: {
  title: string;
  pathname: string;
  items: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }>;
}) {
  return (
    <div className="mt-7">
      <p className="px-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <nav className="mt-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "focus-ring flex h-10 items-center gap-3 rounded-[8px] px-3 text-sm font-bold editorial-transition hover:bg-muted",
                active && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function MobileNavItem({
  item,
  active
}: {
  active: boolean;
  item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "focus-ring flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-bold",
        active && "bg-foreground text-background"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {item.label}
    </Link>
  );
}
