"use client";

import {
  BarChart3,
  CheckCircle2,
  Clipboard,
  Code2,
  KeyRound,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UserPen,
  Users,
  Workflow,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocalStorageState } from "@/hooks/use-local-storage";

type MemberRole = "Owner" | "Admin" | "Sales" | "Manager" | "Viewer";
type FieldType = "Text" | "Number" | "Date" | "Dropdown" | "Boolean";
type ConnectionStatus = "connected" | "disconnected";

interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
}

interface CrmField {
  id: string;
  name: string;
  type: FieldType;
  description: string;
  required: boolean;
}

interface ApiKey {
  id: string;
  label: string;
  key: string;
  createdAt: string;
}

const memberRoles: MemberRole[] = ["Owner", "Admin", "Sales", "Manager", "Viewer"];
const fieldTypes: FieldType[] = ["Text", "Number", "Date", "Dropdown", "Boolean"];
const providerNames = ["Exotel", "Twilio", "Custom SIP"];
const adTabs = ["Google Ads", "Facebook Ads", "LinkedIn Ads"];

export function TeamMembersClient() {
  const [members, setMembers] = useLocalStorageState<Member[]>("groweasy-team-members", []);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "Sales" as MemberRole });
  const [error, setError] = useState("");

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return members;
    }
    return members.filter((member) => [member.name, member.email, member.role].some((value) => value.toLowerCase().includes(normalized)));
  }, [members, query]);

  function openAddModal() {
    setEditing({ id: "", name: "", email: "", role: "Sales" });
    setForm({ name: "", email: "", role: "Sales" });
    setError("");
  }

  function openEditModal(member: Member) {
    setEditing(member);
    setForm({ name: member.name, email: member.email, role: member.role });
    setError("");
  }

  function saveMember() {
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Enter a name and valid email address.");
      return;
    }

    if (editing?.id) {
      setMembers((current) => current.map((member) => (member.id === editing.id ? { ...member, ...form } : member)));
    } else {
      setMembers((current) => [{ id: crypto.randomUUID(), ...form }, ...current]);
    }

    setEditing(null);
  }

  return (
    <ShellSection eyebrow="Team Members" title="Invite and Manage Members" body="Add sales, operations, and admin users for local workspace planning.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search members..." />
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {filteredMembers.length === 0 ? (
        <EmptyCard icon={<Users className="h-10 w-10" />} title="No members yet" body="Invite your first teammate and assign a role for the GrowEasy workspace." action="Add Member" onAction={openAddModal} />
      ) : (
        <div className="mt-5 grid gap-3">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="grid gap-3 p-4 md:grid-cols-[1fr_140px_auto_auto] md:items-center">
              <div>
                <p className="font-black">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <Badge tone={member.role === "Owner" || member.role === "Admin" ? "success" : "muted"}>{member.role}</Badge>
              <Button variant="secondary" size="sm" onClick={() => openEditModal(member)}>
                <UserPen className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => setMembers((current) => current.filter((item) => item.id !== member.id))}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? "Edit Member" : "Invite Member"} onClose={() => setEditing(null)}>
          <div className="grid gap-3">
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" />
            <Input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email address" />
            <Select value={form.role} onChange={(value) => setForm((current) => ({ ...current, role: value as MemberRole }))} options={memberRoles} label="Role" />
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <Button onClick={saveMember}>
              <Save className="h-4 w-4" />
              Save Member
            </Button>
          </div>
        </Modal>
      )}
    </ShellSection>
  );
}

export function AdAccountsClient() {
  const [activeTab, setActiveTab] = useState(adTabs[0]);
  const [connections, setConnections] = useLocalStorageState<Record<string, ConnectionStatus>>("groweasy-ad-accounts", {});
  const [message, setMessage] = useState("");
  const activeStatus = connections[activeTab] ?? "disconnected";

  function toggleConnection(platform: string) {
    const connected = (connections[platform] ?? "disconnected") === "connected";
    setConnections((current) => ({ ...current, [platform]: connected ? "disconnected" : "connected" }));
    setMessage(`${platform} ${connected ? "disconnected" : "connected"} successfully.`);
  }

  return (
    <ShellSection eyebrow="Ad Accounts" title="Campaign Lead Sync" body="Manage paid-channel accounts and monitor whether lead sync is ready.">
      <TabBar tabs={adTabs} active={activeTab} onSelect={setActiveTab} />
      {message && <SuccessMessage>{message}</SuccessMessage>}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {adTabs.map((platform) => {
          const status = connections[platform] ?? "disconnected";
          return (
            <Card key={platform} className="p-5">
              <div className="flex items-center justify-between">
                <BarChart3 className="h-6 w-6 text-muted-foreground" />
                <Badge tone={status === "connected" ? "success" : "muted"}>{status === "connected" ? "Connected" : "Not Connected"}</Badge>
              </div>
              <h2 className="mt-5 text-xl font-black">{platform}</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <Metric label="Campaigns" value={status === "connected" ? "3 active" : "0 active"} />
                <Metric label="Lead Sync" value={status === "connected" ? "Ready" : "Paused"} />
                <Metric label="Selected View" value={platform === activeTab ? "Open" : "Available"} />
              </div>
              <div className="mt-5 flex gap-2">
                <Button variant={status === "connected" ? "danger" : "secondary"} className="flex-1" onClick={() => toggleConnection(platform)}>
                  {status === "connected" ? "Disconnect" : "Connect"}
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Refresh ${platform}`} onClick={() => setMessage(`${platform} refreshed.`)}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      <Card className="mt-5 p-5">
        <h2 className="font-black">{activeTab} Details</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {activeStatus === "connected" ? "Lead sync is ready for active campaigns." : "Connect the account to start syncing campaign leads."}
        </p>
      </Card>
    </ShellSection>
  );
}

export function WhatsAppClient() {
  const [settings, setSettings] = useLocalStorageState("groweasy-whatsapp", {
    connected: false,
    phone: "",
    webhook: "https://api.groweasy.local/webhooks/whatsapp"
  });
  const [message, setMessage] = useState("");

  async function copyWebhook() {
    await navigator.clipboard?.writeText(settings.webhook).catch(() => undefined);
    setMessage("Webhook copied.");
  }

  return (
    <ShellSection eyebrow="WhatsApp Account" title="WhatsApp Setup" body="Prepare phone, webhook, and connection status for contact capture.">
      {message && <SuccessMessage>{message}</SuccessMessage>}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Connection Status</h2>
            <Badge tone={settings.connected ? "success" : "muted"}>{settings.connected ? "Connected" : "Not Connected"}</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            <Input value={settings.phone} onChange={(event) => setSettings((current) => ({ ...current, phone: event.target.value }))} placeholder="WhatsApp phone number" />
            <div className="rounded-[8px] border border-border bg-background p-3">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Webhook URL</p>
              <p className="mt-2 break-all text-sm font-bold">{settings.webhook}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setSettings((current) => ({ ...current, connected: true }))}>Connect</Button>
              <Button variant="secondary" onClick={() => setSettings((current) => ({ ...current, connected: false }))}>Disconnect</Button>
              <Button variant="ghost" onClick={copyWebhook}>
                <Clipboard className="h-4 w-4" />
                Copy Webhook
              </Button>
            </div>
          </div>
        </Card>
        <Card className="flex min-h-[280px] flex-col items-center justify-center p-5 text-center">
          <div className="grid h-36 w-36 grid-cols-3 gap-2 rounded-[8px] border border-border p-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <span key={index} className={index % 2 === 0 ? "bg-foreground" : "bg-muted"} />
            ))}
          </div>
          <h2 className="mt-5 font-black">QR Pairing</h2>
          <p className="mt-2 text-sm text-muted-foreground">Scan from the WhatsApp business device when connecting a live account.</p>
        </Card>
      </div>
    </ShellSection>
  );
}

export function TeleCallingClient() {
  const [state, setState] = useLocalStorageState("groweasy-tele-calling", { provider: "Exotel", connected: false });

  return (
    <ShellSection eyebrow="Tele Calling" title="Calling Provider" body="Configure calling provider readiness for sales follow-up.">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Provider Setup</h2>
            <p className="mt-1 text-sm text-muted-foreground">Select a provider and manage call sync state.</p>
          </div>
          <Badge tone={state.connected ? "success" : "muted"}>{state.connected ? "Connected" : "Not Connected"}</Badge>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Select value={state.provider} onChange={(provider) => setState((current) => ({ ...current, provider }))} options={providerNames} label="Provider" />
          <Button onClick={() => setState((current) => ({ ...current, connected: true }))}>Connect</Button>
          <Button variant="secondary" onClick={() => setState((current) => ({ ...current, connected: false }))}>Disconnect</Button>
        </div>
      </Card>
      <EmptyCard icon={<Phone className="h-10 w-10" />} title="No recent calls" body={`${state.provider} call logs will appear here after connection.`} />
    </ShellSection>
  );
}

export function CrmFieldsClient() {
  const [fields, setFields] = useLocalStorageState<CrmField[]>("groweasy-crm-fields", []);
  const [form, setForm] = useState({ name: "", type: "Text" as FieldType, description: "", required: false });
  const [error, setError] = useState("");

  function addField() {
    if (!form.name.trim()) {
      setError("Field name is required.");
      return;
    }
    setFields((current) => [{ id: crypto.randomUUID(), ...form }, ...current]);
    setForm({ name: "", type: "Text", description: "", required: false });
    setError("");
  }

  return (
    <ShellSection eyebrow="CRM Fields" title="Custom CRM Fields" body="Define extra lead fields used by your import review workflow.">
      <Card className="p-5">
        <h2 className="text-xl font-black">Create Field</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_1fr_auto_auto]">
          <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Field name" />
          <Select value={form.type} onChange={(type) => setForm((current) => ({ ...current, type: type as FieldType }))} options={fieldTypes} label="Type" />
          <Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
          <label className="focus-ring flex h-11 items-center gap-2 rounded-[8px] border border-border px-3 text-sm font-bold">
            <input type="checkbox" checked={form.required} onChange={(event) => setForm((current) => ({ ...current, required: event.target.checked }))} />
            Required
          </label>
          <Button onClick={addField}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </Card>

      {fields.length === 0 ? (
        <EmptyCard icon={<Workflow className="h-10 w-10" />} title="No custom fields" body="Create a field to extend the CRM import review table." />
      ) : (
        <div className="mt-5 grid gap-3">
          {fields.map((field) => (
            <Card key={field.id} className="grid gap-3 p-4 md:grid-cols-[1fr_140px_120px_auto] md:items-center">
              <div>
                <p className="font-black">{field.name}</p>
                <p className="text-sm text-muted-foreground">{field.description || "No description"}</p>
              </div>
              <Badge tone="muted">{field.type}</Badge>
              <button
                type="button"
                className="focus-ring rounded-[8px] border border-border px-3 py-2 text-xs font-black"
                onClick={() => setFields((current) => current.map((item) => (item.id === field.id ? { ...item, required: !item.required } : item)))}
              >
                {field.required ? "Required" : "Optional"}
              </button>
              <Button variant="danger" size="sm" onClick={() => setFields((current) => current.filter((item) => item.id !== field.id))}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </Card>
          ))}
        </div>
      )}
    </ShellSection>
  );
}

export function ApiCenterClient() {
  const [keys, setKeys] = useLocalStorageState<ApiKey[]>("groweasy-api-keys", []);
  const [message, setMessage] = useState("");
  const webhook = "https://api.groweasy.local/webhooks/imports";

  function generateKey() {
    const key = `ge_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
    setKeys((current) => [{ id: crypto.randomUUID(), label: `Production key ${current.length + 1}`, key, createdAt: new Date().toISOString() }, ...current]);
    setMessage("API key generated.");
  }

  async function copyValue(value: string) {
    await navigator.clipboard?.writeText(value).catch(() => undefined);
    setMessage("Copied to clipboard.");
  }

  return (
    <ShellSection eyebrow="API Center" title="Developer APIs" body="Manage API keys, webhooks, and import endpoints for technical teams.">
      {message && <SuccessMessage>{message}</SuccessMessage>}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">API Keys</h2>
            <Button onClick={generateKey}>
              <KeyRound className="h-4 w-4" />
              Generate Key
            </Button>
          </div>
          <div className="mt-5 grid gap-3">
            {keys.length === 0 ? (
              <p className="rounded-[8px] border border-dashed border-border p-4 text-sm text-muted-foreground">No API keys generated yet.</p>
            ) : (
              keys.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-[8px] border border-border p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <p className="font-black">{item.label}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{item.key}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => copyValue(item.key)}>Copy</Button>
                  <Button variant="danger" size="sm" onClick={() => setKeys((current) => current.filter((key) => key.id !== item.id))}>Revoke</Button>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-black">Webhook Status</h2>
          <Badge tone="warning" className="mt-3">Coming Soon</Badge>
          <p className="mt-4 break-all text-sm text-muted-foreground">{webhook}</p>
          <Button variant="secondary" className="mt-5" onClick={() => copyValue(webhook)}>
            <Clipboard className="h-4 w-4" />
            Copy Endpoint
          </Button>
        </Card>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <InfoPanel icon={<Code2 className="h-5 w-5" />} title="Import Endpoint" body="POST /import accepts filename, headers, and rows." />
        <InfoPanel icon={<ShieldCheck className="h-5 w-5" />} title="Request ID" body="Use X-Request-Id to trace uploads and imports." />
        <InfoPanel icon={<Settings2 className="h-5 w-5" />} title="API Docs" body="REST documentation is included in the repository README." />
      </div>
    </ShellSection>
  );
}

export function SettingsClient() {
  const [settings, setSettings] = useLocalStorageState("groweasy-settings", {
    aiProvider: "Gemini",
    language: "English",
    delimiter: "Comma",
    timezone: "Asia/Kolkata"
  });
  const [message, setMessage] = useState("");

  return (
    <ShellSection eyebrow="Settings" title="Import Controls" body="Tune workspace preferences for AI mapping, CSV parsing, language, and timezone.">
      {message && <SuccessMessage>{message}</SuccessMessage>}
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Select value={settings.aiProvider} onChange={(aiProvider) => setSettings((current) => ({ ...current, aiProvider }))} options={["Gemini", "OpenAI"]} label="AI Provider" />
          <Select value={settings.language} onChange={(language) => setSettings((current) => ({ ...current, language }))} options={["English", "Hindi", "Kannada"]} label="Language" />
          <Select value={settings.delimiter} onChange={(delimiter) => setSettings((current) => ({ ...current, delimiter }))} options={["Comma", "Semicolon", "Tab"]} label="CSV Delimiter" />
          <Select value={settings.timezone} onChange={(timezone) => setSettings((current) => ({ ...current, timezone }))} options={["Asia/Kolkata", "UTC", "America/New_York"]} label="Timezone" />
        </div>
        <Button className="mt-5" onClick={() => setMessage("Settings saved.")}>
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </Card>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <InfoPanel icon={<CheckCircle2 className="h-5 w-5" />} title="AI Mapping" body="Provider preference is saved locally for workspace review." />
        <InfoPanel icon={<ShieldCheck className="h-5 w-5" />} title="Schema Guard" body="Imported records remain validated by the backend schema." />
        <InfoPanel icon={<RefreshCw className="h-5 w-5" />} title="Batch Safety" body="Rows continue to process in controlled, retryable batches." />
      </div>
    </ShellSection>
  );
}

function ShellSection({ eyebrow, title, body, children }: { eyebrow: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <section className="min-h-screen px-4 py-6 md:px-8 xl:px-10">
      <div className="mx-auto max-w-[1180px]">
        <p className="text-xs font-black uppercase text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-1 font-display text-3xl font-black md:text-5xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative w-full sm:max-w-sm">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-9" />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase text-muted-foreground">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="focus-ring h-11 w-full rounded-[8px] border border-border bg-card px-3 text-sm font-bold">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TabBar({ tabs, active, onSelect }: { tabs: string[]; active: string; onSelect: (value: string) => void }) {
  return (
    <div className="scrollbar-soft flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`focus-ring shrink-0 rounded-[8px] border border-border px-4 py-2 text-sm font-black ${active === tab ? "bg-foreground text-background" : "bg-card"}`}
          onClick={() => onSelect(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8" role="dialog" aria-modal="true" aria-label={title}>
      <Card className="w-full max-w-lg p-5 shadow-soft">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">{title}</h2>
          <Button variant="ghost" size="icon" aria-label={`Close ${title}`} onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </Card>
    </div>
  );
}

function EmptyCard({ icon, title, body, action, onAction }: { icon: React.ReactNode; title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <Card className="mt-5 flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <h2 className="mt-5 text-2xl font-black">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{body}</p>
      {action && onAction && (
        <Button onClick={onAction} className="mt-6">
          <Plus className="h-4 w-4" />
          {action}
        </Button>
      )}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function InfoPanel({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-accent text-accent-foreground">{icon}</div>
      <h2 className="mt-4 text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </Card>
  );
}

function SuccessMessage({ children }: { children: React.ReactNode }) {
  return <div className="mb-5 rounded-[8px] bg-accent px-4 py-3 text-sm font-bold text-accent-foreground">{children}</div>;
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 rounded-[8px] bg-[#ffe5dc] px-4 py-3 text-sm font-bold text-[#7a270f]">{children}</div>;
}
