import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Activity, AlertTriangle, ClipboardCheck, Flame, Gauge, LineChart as LineIcon, Plus, Scale, Zap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { CheckinDialog } from "@/components/physique/CheckinDialog";
import { MacroBar, Pill, Stat } from "@/components/physique/bits";
import { Panel } from "@/components/physique/AppShell";
import { SessionCard, WeekStrip } from "@/components/physique/PlanView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { autoRegulation, energy } from "@/lib/physique/calc";
import { GOAL_LABEL, INJURY_LABEL, LEVEL_LABEL, MUSCLE_LABEL } from "@/lib/physique/labels";
import { methodLabel } from "@/lib/physique/methods";
import { planPayload } from "@/lib/physique/payload";
import { buildPlan } from "@/lib/physique/plan";
import { usePhysique } from "@/lib/physique/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Plan treningowy · PhysiqueOS" },
      { name: "description", content: "Plan treningowy stworzony w PhysiqueOS: energia, makro, masa ciała, auto-regulacja i podgląd tygodnia." },
      { property: "og:title", content: "Plan treningowy · PhysiqueOS" },
      { property: "og:description", content: "Plan treningowy stworzony w PhysiqueOS dla wybranego podopiecznego." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { active, updateClient, emit } = usePhysique();
  const plan = buildPlan(active);
  const e = energy(active);
  const reg = autoRegulation(active);
  const totalMacroKcal = e.protein * 4 + e.carbs * 4 + e.fat * 9 || 1;
  const checkins = [...active.checkins].sort((a, b) => a.date.localeCompare(b.date));
  const chartData = checkins.map((c) => ({ date: c.date.slice(5).split("-").reverse().join("."), weight: c.weight }));
  const toGoal = Math.round((active.targetWeight - active.weight) * 10) / 10;
  const keyVolume = plan.volume.filter((v) => ["chest", "back", "quads", "hamstrings", "sideDelt", "glutes"].includes(v.muscle));

  const onSwap = (key: string, exerciseId: string | null) => {
    const next = { ...(active.exerciseSwaps ?? {}) };
    if (exerciseId) next[key] = exerciseId;
    else delete next[key];
    updateClient(active.id, { exerciseSwaps: next });
  };
  const swap = { equipment: active.equipment, injuries: active.injuries, onSwap };

  const createPlan = async () => {
    const at = new Date().toISOString();
    updateClient(active.id, { planCreatedAt: at });
    toast.success(`Plan stworzony dla: ${active.name}`);
    const res = await emit("plan.generated", planPayload(active, at), { clientName: active.name });
    if (res?.ok) toast.success("Plan wysłany do n8n");
    else if (res) toast.error(`n8n: ${res.error ?? "błąd wysyłki"}`);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <section className="panel relative overflow-hidden">
        <div className="hazard h-2 border-b-2 border-frame" />
        <div className="relative flex flex-col gap-5 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-stencil text-base text-primary">PhysiqueOS</span>
                <span className="text-subtle">/</span>
                <span className="eyebrow">Plan treningowy</span>
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                Plan stworzony dla: <span className="text-primary">{active.name}</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                {active.planCreatedAt
                  ? `Plan treningowy stworzony w PhysiqueOS · ${format(new Date(active.planCreatedAt), "d MMMM yyyy, HH:mm", { locale: pl })}`
                  : "Plan treningowy stworzony w PhysiqueOS na podstawie wywiadu — zatwierdź, aby zapisać datę."}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="subtle" asChild>
                <Link to="/wywiad">Edytuj wywiad</Link>
              </Button>
              <Button className="border-2 border-frame font-display text-base font-bold uppercase tracking-wide shadow-glow" onClick={createPlan}>
                <ClipboardCheck />
                Stwórz plan
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill label="Płeć" value={active.gender === "M" ? "Mężczyzna" : "Kobieta"} />
            <Pill label="Cel" value={GOAL_LABEL[active.goal]} />
            <Pill label="Poziom" value={LEVEL_LABEL[active.level]} />
            <Pill label="Dni/tydz." value={active.days} />
            <Pill label="Metodyka" value={methodLabel(active.method, active)} />
            <Pill label="Progresja" value={plan.progression.name} />
            <Pill label="Sprzęt" value={`${active.equipment.length} poz.`} />
            <Pill
              label="Kontuzje"
              value={active.injuries.length ? active.injuries.map((i) => INJURY_LABEL[i]).join(", ") : "brak"}
              className={active.injuries.length ? "border-warning/30" : ""}
            />
          </div>
        </div>
      </section>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel title="Energia" icon={<Flame />}>
          <div className="space-y-4">
            <Stat label="Cel dzienny" value={e.target.toLocaleString("pl-PL")} unit="kcal" hint={GOAL_LABEL[active.goal]} />
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
              <div>
                <div className="text-muted-foreground">BMR</div>
                <div className="tabular font-medium">{e.bmr} kcal</div>
              </div>
              <div>
                <div className="text-muted-foreground">TDEE · PAL {active.pal}</div>
                <div className="tabular font-medium">{e.tdee} kcal</div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Makroskładniki" icon={<Gauge />}>
          <div className="space-y-3">
            <MacroBar label="Białko" grams={e.protein} kcal={e.protein * 4} share={(e.protein * 4) / totalMacroKcal} tone="protein" />
            <MacroBar label="Węglowodany" grams={e.carbs} kcal={e.carbs * 4} share={(e.carbs * 4) / totalMacroKcal} tone="carbs" />
            <MacroBar label="Tłuszcze" grams={e.fat} kcal={e.fat * 9} share={(e.fat * 9) / totalMacroKcal} tone="fat" />
            <div className="space-y-3 border-t border-border pt-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Białko</span>
                  <span className="tabular font-medium">{(e.protein / active.weight).toFixed(1)} g/kg</span>
                </div>
                <Slider
                  aria-label="Białko g/kg"
                  min={1.2}
                  max={3.2}
                  step={0.1}
                  value={[Math.round((e.protein / active.weight) * 10) / 10]}
                  onValueChange={([v]) => v !== undefined && updateClient(active.id, { proteinPerKg: v })}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Tłuszcze</span>
                  <span className="tabular font-medium">{(e.fat / active.weight).toFixed(1)} g/kg</span>
                </div>
                <Slider
                  aria-label="Tłuszcze g/kg"
                  min={0.5}
                  max={1.8}
                  step={0.1}
                  value={[Math.round((e.fat / active.weight) * 10) / 10]}
                  onValueChange={([v]) => v !== undefined && updateClient(active.id, { fatPerKg: v })}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Węglowodany = reszta kalorii</span>
                {(active.proteinPerKg !== undefined || active.fatPerKg !== undefined) && (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => updateClient(active.id, { proteinPerKg: undefined, fatPerKg: undefined })}
                  >
                    Domyślne
                  </button>
                )}
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Masa ciała"
          icon={<Scale />}
          action={
            <CheckinDialog
              trigger={
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  <Plus /> Check-in
                </Button>
              }
            />
          }
        >
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Stat label="Aktualnie" value={active.weight} unit="kg" />
              <div className="text-right text-xs">
                <div className="text-muted-foreground">Cel {active.targetWeight} kg</div>
                <div className="tabular font-medium text-primary">
                  {toGoal === 0 ? "osiągnięty" : `${toGoal > 0 ? "+" : ""}${toGoal} kg`}
                </div>
              </div>
            </div>
            <div className="h-20">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} hide />
                    <Tooltip
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border-strong)", borderRadius: 6, fontSize: 12 }}
                      labelStyle={{ color: "var(--muted-foreground)" }}
                      formatter={(v: number) => [`${v} kg`, "Masa"]}
                    />
                    <Area type="monotone" dataKey="weight" stroke="var(--chart-1)" strokeWidth={2} fill="url(#wfill)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">Dodaj check-iny, by zobaczyć trend.</div>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="Auto-regulacja" icon={<Zap />}>
          <div className="flex h-full flex-col justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="tabular font-display text-3xl font-bold">
                  {reg.weeklyChangePct === null ? "—" : `${reg.weeklyChangePct > 0 ? "+" : ""}${reg.weeklyChangePct}%`}
                </span>
                <span className="text-xs text-muted-foreground">/ tydzień</span>
              </div>
              <Badge variant={reg.tone === "ok" ? "success" : reg.tone === "warn" ? "warning" : "muted"}>
                {reg.tone === "ok" ? "W normie" : reg.tone === "warn" ? "Korekta" : "Za mało danych"}
              </Badge>
              <p className="text-xs leading-relaxed text-muted-foreground">{reg.advice}</p>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
              <span className="tabular text-[11px] text-muted-foreground">
                Korekta: {(active.kcalOffset ?? 0) > 0 ? "+" : ""}
                {active.kcalOffset ?? 0} kcal
              </span>
              {reg.kcalDelta !== 0 ? (
                <Button
                  size="sm"
                  variant="subtle"
                  className="h-7 text-xs"
                  onClick={() => {
                    updateClient(active.id, { kcalOffset: (active.kcalOffset ?? 0) + reg.kcalDelta });
                    toast.success(`Kalorie ${reg.kcalDelta > 0 ? "zwiększone" : "zmniejszone"} o ${Math.abs(reg.kcalDelta)} kcal`);
                  }}
                >
                  Zastosuj {reg.kcalDelta > 0 ? "+" : ""}
                  {reg.kcalDelta}
                </Button>
              ) : (active.kcalOffset ?? 0) !== 0 ? (
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateClient(active.id, { kcalOffset: 0 })}>
                  Resetuj
                </Button>
              ) : null}
            </div>
          </div>
        </Panel>
      </div>

      {/* Plan preview */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title={`Podgląd planu · ${plan.method.name}`}
          icon={<LineIcon />}
          action={
            <span className="eyebrow">
              {plan.week} · RIR {plan.rir}
            </span>
          }
        >
          <div className="space-y-4">
            <WeekStrip plan={plan} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground">{plan.progression.name}:</span> {plan.progressionRule}
              </p>
              <Link to="/wywiad" hash="rozklad" className="shrink-0 text-xs text-primary hover:underline">
                Zmień partie w dniach →
              </Link>
            </div>
            {plan.warnings.length > 0 && (
              <ul className="space-y-1.5 border-2 border-warning/50 bg-warning/5 p-3">
                {plan.warnings.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-xs text-warning">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            )}
            <div className="grid gap-3 2xl:grid-cols-2">
              {plan.sessions.map((s) => (
                <SessionCard key={`${s.weekday}-${s.name}`} session={s} swap={swap} />
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          title="Objętość tygodniowa"
          icon={<Activity />}
          action={
            <Link to="/objetosc" className="text-xs text-primary hover:underline">
              Szczegóły
            </Link>
          }
          className="h-fit"
        >
          <div className="space-y-3">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Partia</span>
              <span>bezpośr. + pośr. = łącznie</span>
            </div>
            {keyVolume.map((v) => {
              const scale = Math.max(v.landmark.mrv, v.target, v.total, 1);
              const pct = Math.min(100, (v.total / scale) * 100);
              const goal = (v.target / scale) * 100;
              return (
                <div key={v.muscle} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{MUSCLE_LABEL[v.muscle]}</span>
                    <span className="tabular text-muted-foreground">
                      {v.direct} + {v.indirect} = <span className="font-medium text-foreground">{v.total}</span>
                    </span>
                  </div>
                  <div className="relative h-2.5 border border-frame bg-secondary">
                    <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${pct}%` }} />
                    <span className="absolute -inset-y-1 w-0.5 bg-foreground" style={{ left: `${goal}%` }} />
                  </div>
                </div>
              );
            })}
            <p className="pt-1 text-[11px] text-subtle">Kreska to ustawiona objętość na ten tydzień.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
