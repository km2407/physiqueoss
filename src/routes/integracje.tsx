import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { CheckCircle2, Eye, EyeOff, Send, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/physique/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkinPayload, planPayload, testPayload } from "@/lib/physique/payload";
import { usePhysique } from "@/lib/physique/store";

export const Route = createFileRoute("/integracje")({
  head: () => ({
    meta: [
      { title: "Integracje n8n · PhysiqueOS" },
      { name: "description", content: "Wysyłka planów i check-inów do n8n przez webhook z nagłówkiem X-Webhook-Secret." },
      { property: "og:title", content: "Integracje n8n · PhysiqueOS" },
      { property: "og:description", content: "Webhook n8n: zdarzenia plan.generated i checkin.submitted, dziennik wysyłek i podgląd JSON." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Integrations,
});

function Row({ id, label, description, checked, onChange, disabled }: { id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <Label htmlFor={id} className="font-mono text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function Integrations() {
  const { webhook, setWebhook, log, clearLog, emit, active } = usePhysique();
  const [showSecret, setShowSecret] = useState(false);
  const [sending, setSending] = useState(false);

  const sendTest = async () => {
    if (!webhook.url) {
      toast.error("Podaj URL webhooka n8n.");
      return;
    }
    setSending(true);
    const res = await emit("test", testPayload(), { force: true });
    setSending(false);
    if (res?.ok) toast.success(`Test wysłany · HTTP ${res.status}`);
    else toast.error(res?.error ?? "Nie udało się wysłać testu");
  };

  const previews = {
    "plan.generated": planPayload(active),
    "checkin.submitted": checkinPayload(active),
    test: testPayload(),
  };

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Integracje"
        title="Integracje n8n"
        description="PhysiqueOS wysyła zdarzenia metodą POST na Twój webhook n8n. Sekret trafia w nagłówku X-Webhook-Secret."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Webhook" className="lg:col-span-3">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wh-url" className="text-xs text-muted-foreground">URL webhooka</Label>
              <Input
                id="wh-url"
                className="font-mono text-xs"
                placeholder="https://twoj-n8n.app/webhook/physiqueos"
                value={webhook.url}
                maxLength={2000}
                onChange={(e) => setWebhook({ url: e.target.value.trim() })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wh-secret" className="text-xs text-muted-foreground">
                Sekret · nagłówek <span className="font-mono text-foreground">X-Webhook-Secret</span>
              </Label>
              <div className="relative">
                <Input
                  id="wh-secret"
                  className="pr-10 font-mono text-xs"
                  type={showSecret ? "text" : "password"}
                  value={webhook.secret}
                  maxLength={500}
                  onChange={(e) => setWebhook({ secret: e.target.value })}
                  placeholder="np. długi losowy ciąg"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showSecret ? "Ukryj sekret" : "Pokaż sekret"}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-subtle">Zapisywany tylko na tym urządzeniu.</p>
            </div>
            <div className="divide-y divide-border border-y border-border">
              <Row id="wh-enabled" label="Wysyłka włączona" description="Główny przełącznik automatycznych wysyłek." checked={webhook.enabled} onChange={(v) => setWebhook({ enabled: v })} />
              <Row id="wh-plan" label="plan.generated" description="Po kliknięciu „Stwórz plan” na stronie planu." checked={webhook.planGenerated} onChange={(v) => setWebhook({ planGenerated: v })} disabled={!webhook.enabled} />
              <Row id="wh-checkin" label="checkin.submitted" description="Po zapisaniu nowego check-inu podopiecznego." checked={webhook.checkinSubmitted} onChange={(v) => setWebhook({ checkinSubmitted: v })} disabled={!webhook.enabled} />
            </div>
            <Button variant="glow" onClick={sendTest} disabled={sending}>
              <Send /> {sending ? "Wysyłanie…" : "Wyślij test"}
            </Button>
          </div>
        </Panel>

        <Panel
          title="Dziennik wysyłek"
          className="lg:col-span-2"
          action={
            log.length > 0 ? (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={clearLog}>
                <Trash2 /> Wyczyść
              </Button>
            ) : null
          }
        >
          {log.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Brak wysyłek. Wyślij test, aby sprawdzić połączenie.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {log.map((l) => (
                <li key={l.id} className="flex items-start gap-2.5 py-2.5">
                  {l.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs">{l.event}</span>
                      <span className="tabular text-[11px] text-subtle">{format(new Date(l.at), "dd.MM HH:mm:ss")}</span>
                    </div>
                    <div className="tabular text-[11px] text-muted-foreground">
                      {l.status ? `HTTP ${l.status}` : "brak odpowiedzi"} · {l.durationMs} ms{l.clientName ? ` · ${l.clientName}` : ""}
                    </div>
                    {l.error && <div className="text-[11px] text-destructive">{l.error}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title={`Podgląd payloadu JSON · ${active.name}`}>
        <Tabs defaultValue="plan.generated">
          <TabsList className="bg-secondary/60">
            {Object.keys(previews).map((k) => (
              <TabsTrigger key={k} value={k} className="font-mono text-xs">
                {k}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(previews).map(([k, v]) => (
            <TabsContent key={k} value={k}>
              <pre className="max-h-[480px] overflow-auto rounded-md border border-border bg-background p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {JSON.stringify(v, null, 2)}
              </pre>
            </TabsContent>
          ))}
        </Tabs>
      </Panel>
    </div>
  );
}
