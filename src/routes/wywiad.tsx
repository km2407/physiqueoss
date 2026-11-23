import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Check, Dumbbell, HeartPulse, Info, Layers, Target, CalendarDays, TrendingUp, Trophy } from "lucide-react";
import { toast } from "sonner";
import { ScheduleEditor } from "@/components/physique/ScheduleEditor";
import { useMemo, type ReactNode } from "react";
import { PageHeader } from "@/components/physique/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXERCISES } from "@/lib/physique/exercises";
import {
  ALL_EQUIPMENT,
  EQUIPMENT_LABEL,
  EQUIPMENT_PRESETS,
  GOAL_LABEL,
  INJURY_LABEL,
  LEVEL_LABEL,
  PAL_OPTIONS,
} from "@/lib/physique/labels";
import { autoMethod, BODYBUILDER_SPLITS, daysHint, METHOD_BY_ID, METHODS, methodSuitability, type Methodology } from "@/lib/physique/methods";
import { autoDayName, buildPlan, DAY_LABELS } from "@/lib/physique/plan";
import { PROGRESSIONS } from "@/lib/physique/progression";
import { usePhysique } from "@/lib/physique/store";
import type { Client, Equipment, Goal, Injury, Level, MethodId } from "@/lib/physique/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wywiad")({
  head: () => ({
    meta: [
      { title: "Wywiad · PhysiqueOS" },
      { name: "description", content: "Wywiad z podopiecznym: dane, cel, dni treningowe 1–7, metodyka, sprzęt i kontuzje." },
      { property: "og:title", content: "Wywiad · PhysiqueOS" },
      { property: "og:description", content: "Pełny wywiad treningowy, z którego PhysiqueOS tworzy plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Interview,
});

function Section({ n, title, icon, description, children }: { n: number; title: string; icon: ReactNode; description?: string; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <span className="tabular grid h-6 w-6 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-sm font-medium [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-muted-foreground">
            {icon}
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function NumField({ id, label, value, onChange, unit, min, max, step = 1 }: { id: string; label: string; value: number; onChange: (v: number) => void; unit?: string; min: number; max: number; step?: number }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) onChange(Math.min(max, Math.max(0, v)));
          }}
          className="tabular pr-10"
        />
        {unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children, tone = "primary" }: { active: boolean; onClick: () => void; children: ReactNode; tone?: "primary" | "warning" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
        active
          ? tone === "warning"
            ? "border-warning/40 bg-warning/10 text-warning"
            : "border-primary/40 bg-primary/10 text-primary"
          : "border-border-strong text-muted-foreground hover:border-border-strong hover:bg-secondary hover:text-foreground",
      )}
    >
      {active && <Check className="h-3 w-3" />}
      {children}
    </button>
  );
}

function Interview() {
  const { active, updateClient } = usePhysique();
  const set = (patch: Partial<Client>) => updateClient(active.id, patch);
  const hint = daysHint(active.days, active.level);
  const auto = autoMethod(active);
  const plan = useMemo(() => buildPlan(active), [active]);

  const changeDays = (d: number) => {
    const preset = active.method !== "auto" && !!METHOD_BY_ID[active.method].preset;
    if (active.customSchedule) toast.info("Ręczny układ dni zastąpiono automatycznym.");
    if (preset) toast.info("Split kulturysty ma stałe dni — przełączono na tryb automatyczny.");
    set({ days: d, customSchedule: undefined, ...(preset ? { method: "auto" as const } : {}) });
  };
  const chooseMethod = (m: Methodology) =>
    set({ method: m.id as MethodId, customSchedule: undefined, ...(m.preset ? { days: m.preset.length } : {}) });

  const toggleEquipment = (e: Equipment) =>
    set({ equipment: active.equipment.includes(e) ? active.equipment.filter((x) => x !== e) : [...active.equipment, e] });
  const toggleInjury = (i: Injury) =>
    set({ injuries: active.injuries.includes(i) ? active.injuries.filter((x) => x !== i) : [...active.injuries, i] });

  const injuryImpact = (Object.keys(INJURY_LABEL) as Injury[])
    .filter((i) => active.injuries.includes(i))
    .map((i) => ({
      injury: i,
      excluded: EXERCISES.filter((e) => e.risk.includes(i) && e.needs.every((n) => active.equipment.includes(n))).map((e) => e.name),
      swaps: plan.sessions.flatMap((s) => s.exercises).filter((e) => e.replaced?.injuries.includes(i)),
    }));

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={`Wywiad · ${active.name}`}
        title="Wywiad z podopiecznym"
        description="Zmiany zapisują się od razu i natychmiast przebudowują plan, kalorie oraz motyw kolorystyczny."
        actions={
          <Button variant="glow" asChild>
            <Link to="/">Zobacz plan</Link>
          </Button>
        }
      />

      <div className="space-y-5">
        <Section n={1} title="Podstawowe dane i cel" icon={<Target />}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name" className="text-xs text-muted-foreground">Imię / pseudonim</Label>
              <Input id="name" value={active.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Płeć</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["M", "K"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    data-gender={g}
                    onClick={() => set({ gender: g })}
                    className={cn(
                      "flex h-9 items-center justify-center gap-2 rounded-md border text-sm transition-colors",
                      active.gender === g ? "border-primary/50 bg-primary/10 text-primary" : "border-border-strong text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {g === "M" ? "M — mężczyzna" : "K — kobieta"}
                  </button>
                ))}
              </div>
            </div>
            <NumField id="age" label="Wiek" value={active.age} onChange={(v) => set({ age: v })} unit="lat" min={12} max={90} />
            <NumField id="height" label="Wzrost" value={active.height} onChange={(v) => set({ height: v })} unit="cm" min={120} max={230} />
            <NumField id="weight" label="Masa ciała" value={active.weight} onChange={(v) => set({ weight: v })} unit="kg" min={30} max={300} step={0.1} />
            <NumField id="target" label="Waga docelowa" value={active.targetWeight} onChange={(v) => set({ targetWeight: v })} unit="kg" min={30} max={300} step={0.1} />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Poziom zaawansowania</Label>
              <Select value={active.level} onValueChange={(v) => set({ level: v as Level })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => (
                    <SelectItem key={l} value={l}>{LEVEL_LABEL[l]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cel</Label>
              <Select value={active.goal} onValueChange={(v) => set({ goal: v as Goal })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
                    <SelectItem key={g} value={g}>{GOAL_LABEL[g]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Aktywność (PAL)</Label>
              <Select value={String(active.pal)} onValueChange={(v) => set({ pal: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAL_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        <Section n={2} title="Liczba dni treningowych w tygodniu" icon={<CalendarDays />} description="Od 1 do 7 dni — układ tygodnia dostosowuje się automatycznie.">
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2" role="radiogroup" aria-label="Dni treningowe">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={plan.sessions.length === d}
                  onClick={() => changeDays(d)}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center rounded-md border transition-colors",
                    plan.sessions.length === d ? "border-primary/50 bg-primary/10 text-primary shadow-glow" : "border-border-strong text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span className="tabular text-lg font-semibold leading-none">{d}</span>
                  <span className="mt-1 text-[10px]">{d === 1 ? "dzień" : "dni"}</span>
                </button>
              ))}
            </div>
            {hint && (
              <div className={cn("flex items-start gap-2 rounded-md border p-3 text-xs", hint.tone === "warn" ? "border-warning/25 bg-warning/5 text-warning" : "border-border-strong bg-secondary/40 text-muted-foreground")}>
                {hint.tone === "warn" ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                {hint.text}
              </div>
            )}
            <ScheduleEditor />
          </div>
        </Section>

        <Section n={3} title="Sposób wybrania planu / metodyka" icon={<Layers />} description="Wybierz konkretną metodykę albo tryb automatyczny dopasowany do poziomu, dni i celu.">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => set({ method: "auto", customSchedule: undefined })}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors",
                active.method === "auto" ? "border-primary/50 bg-primary/10" : "border-border-strong hover:bg-secondary/50",
              )}
            >
              <div>
                <div className="text-sm font-medium">Tryb automatyczny</div>
                <div className="text-xs text-muted-foreground">
                  Dla: {LEVEL_LABEL[active.level].toLowerCase()}, {active.days} dni, {GOAL_LABEL[active.goal].toLowerCase()} → <span className="text-primary">{METHOD_BY_ID[auto].name}</span>
                </div>
              </div>
              {active.method === "auto" && <Badge variant="soft">Wybrano</Badge>}
            </button>
            <div className="grid gap-2 md:grid-cols-2">
              {METHODS.map((m) => {
                const suit = methodSuitability(m.id, active);
                const selected = active.method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => chooseMethod(m)}
                    className={cn(
                      "flex flex-col gap-1.5 rounded-md border p-3 text-left transition-colors",
                      selected ? "border-primary/50 bg-primary/10" : "border-border-strong hover:bg-secondary/50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-medium">{m.name}</span>
                        {m.author && <span className="ml-1.5 text-xs text-muted-foreground">{m.author}</span>}
                      </div>
                      {suit.ok ? <Badge variant="success">Zalecane</Badge> : <Badge variant="warning">Niezalecane</Badge>}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{m.short}</p>
                    <div className="text-[11px] text-subtle">Dla: {m.levels.map((l) => LEVEL_LABEL[l].toLowerCase()).join(", ")}</div>
                    {!suit.ok && (
                      <ul className="space-y-0.5">
                        {suit.reasons.map((r) => (
                          <li key={r} className="flex items-start gap-1.5 text-[11px] text-warning">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 pt-3">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Splity kulturystów</span>
              <span className="text-xs text-muted-foreground">— stały układ dni, możesz go potem zmienić ręcznie</span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {BODYBUILDER_SPLITS.map((m) => {
                const suit = methodSuitability(m.id, active);
                const selected = active.method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => chooseMethod(m)}
                    className={cn(
                      "flex flex-col gap-2 rounded-md border p-3 text-left transition-colors",
                      selected ? "border-primary/50 bg-primary/10" : "border-border-strong hover:bg-secondary/50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-medium">{m.name}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">{m.preset?.length} dni</span>
                      </div>
                      {suit.ok ? <Badge variant="success">Zalecane</Badge> : <Badge variant="warning">Niezalecane</Badge>}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{m.short}</p>
                    <div className="grid grid-cols-7 gap-1">
                      {DAY_LABELS.map((label, wd) => {
                        const d = m.preset?.find((x) => x.weekday === wd);
                        return (
                          <div key={label} title={d ? d.name || autoDayName(d.muscles) : "Wolne"} className={cn("rounded border px-1 py-1 text-center", d ? "border-primary/25 bg-primary/[0.07]" : "border-border")}>
                            <div className="font-mono text-[9px] uppercase text-subtle">{label}</div>
                            <div className={cn("truncate text-[10px]", d ? "text-foreground" : "text-subtle")}>{d ? (d.name || autoDayName(d.muscles)).split(/[ :+]/)[0] : "—"}</div>
                          </div>
                        );
                      })}
                    </div>
                    {!suit.ok && (
                      <ul className="space-y-0.5">
                        {suit.reasons.map((r) => (
                          <li key={r} className="flex items-start gap-1.5 text-[11px] text-warning">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        <Section n={4} title="Progresja" icon={<TrendingUp />} description="Jak plan ma rosnąć z tygodnia na tydzień w mezocyklu T1–T4 + deload.">
          <div className="grid gap-2 md:grid-cols-2">
            {PROGRESSIONS.map((p) => {
              const selected = active.progression === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => set({ progression: p.id })}
                  className={cn(
                    "flex flex-col gap-1 rounded-md border p-3 text-left transition-colors",
                    selected ? "border-primary/50 bg-primary/10" : "border-border-strong hover:bg-secondary/50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{p.name}</span>
                    {selected && <Badge variant="soft">Wybrano</Badge>}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{p.short}</p>
                  <p className="text-[11px] text-subtle">{p.rampsVolume ? "Serie rosną co tydzień" : "Serie stałe, rośnie ciężar / intensywność"}</p>
                </button>
              );
            })}
          </div>
        </Section>

        <Section n={5} title="Dostępny sprzęt" icon={<Dumbbell />} description="Plan dobiera ćwiczenia wyłącznie pod zaznaczony sprzęt.">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow mr-1">Presety</span>
              {EQUIPMENT_PRESETS.map((p) => (
                <Button key={p.id} variant="subtle" size="sm" onClick={() => set({ equipment: [...p.items] })}>
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_EQUIPMENT.map((e) => (
                <Chip key={e} active={active.equipment.includes(e)} onClick={() => toggleEquipment(e)}>
                  {EQUIPMENT_LABEL[e]}
                </Chip>
              ))}
            </div>
            {active.equipment.length === 0 && (
              <p className="text-xs text-warning">Brak sprzętu — plan użyje wyłącznie ćwiczeń z masą ciała.</p>
            )}
          </div>
        </Section>

        <Section n={6} title="Kontuzje i ograniczenia ruchowe" icon={<HeartPulse />} description="Wybrane kontuzje wykluczają ryzykowne ćwiczenia i podpowiadają bezpieczniejsze alternatywy.">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(INJURY_LABEL) as Injury[]).map((i) => (
                <Chip key={i} tone="warning" active={active.injuries.includes(i)} onClick={() => toggleInjury(i)}>
                  {INJURY_LABEL[i]}
                </Chip>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inj-notes" className="text-xs text-muted-foreground">Własne notatki</Label>
              <Textarea id="inj-notes" rows={3} maxLength={1000} value={active.injuryNotes} onChange={(e) => set({ injuryNotes: e.target.value })} placeholder="Np. ból przy pełnym zgięciu, zalecenia fizjoterapeuty…" />
            </div>
            {injuryImpact.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {injuryImpact.map(({ injury, excluded, swaps }) => (
                  <div key={injury} className="rounded-md border border-warning/20 bg-warning/5 p-3">
                    <div className="mb-2 text-xs font-medium text-warning">{INJURY_LABEL[injury]}</div>
                    <div className="text-[11px] text-muted-foreground">Oznaczone jako ryzykowne ({excluded.length}):</div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-subtle">{excluded.join(", ") || "brak przy tym sprzęcie"}</p>
                    {swaps.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-border pt-2">
                        {swaps.map((s) => (
                          <li key={s.key} className="text-[11px] text-muted-foreground">
                            <span className="text-subtle line-through">{s.replaced?.name}</span> → <span className="text-highlight">{s.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
