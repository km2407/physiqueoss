import { AlertTriangle, ArrowRightLeft, Flame, Hand } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { INJURY_LABEL, MUSCLE_LABEL } from "@/lib/physique/labels";
import { DAY_LABELS, exerciseOptions, type Plan } from "@/lib/physique/plan";
import type { Equipment, Injury } from "@/lib/physique/types";
import { cn } from "@/lib/utils";

const AUTO = "__auto";

export interface SwapControl {
  equipment: Equipment[];
  injuries: Injury[];
  onSwap: (key: string, exerciseId: string | null) => void;
}

export function WeekStrip({ plan }: { plan: Plan }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {DAY_LABELS.map((d, i) => {
        const s = plan.sessions.find((x) => x.weekday === i);
        const sets = s?.exercises.reduce((a, e) => a + e.sets, 0) ?? 0;
        return (
          <div
            key={d}
            className={cn(
              "flex min-h-20 flex-col justify-between border-2 px-2 py-1.5",
              s ? "border-frame border-t-4 border-t-primary bg-secondary" : "border-dashed border-border bg-transparent",
            )}
          >
            <span className="eyebrow">{d}</span>
            <span className={cn("text-[11px] leading-tight", s ? "font-medium text-foreground" : "text-subtle")}>
              {s ? s.name : "Wolne"}
            </span>
            {s && <span className="tabular font-display text-sm font-bold text-primary">{sets} serii</span>}
          </div>
        );
      })}
    </div>
  );
}

export function SessionCard({
  session,
  compact,
  swap,
}: {
  session: Plan["sessions"][number];
  compact?: boolean;
  swap?: SwapControl;
}) {
  const total = session.exercises.reduce((a, e) => a + e.sets, 0);
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b-2 border-frame bg-secondary px-4 py-2">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary px-1.5 py-0.5 font-display text-xs font-bold uppercase text-primary-foreground">
            {session.dayLabel}
          </span>
          <span className="font-display text-base font-bold uppercase tracking-wide">{session.name}</span>
        </div>
        <span className="tabular font-mono text-xs text-muted-foreground">
          {session.exercises.length} ćw. · {total} serii
        </span>
      </div>
      <ul className="divide-y divide-border">
        {session.exercises.map((e) => {
          const options = swap ? exerciseOptions(e.muscle, swap.equipment) : [];
          return (
            <li key={e.key} className="flex items-start gap-3 px-4 py-2.5">
              <span className="tabular mt-0.5 w-8 shrink-0 font-display text-lg font-bold leading-none text-primary">{e.sets}×</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm text-foreground">{e.name}</span>
                  {e.swapped && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-highlight">
                      <Hand className="h-3 w-3" />
                      wybrane ręcznie
                    </span>
                  )}
                  {e.risky && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-warning">
                      <AlertTriangle className="h-3 w-3" />
                      ryzyko: {e.risky.map((r) => INJURY_LABEL[r]).join(", ")}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                  <span>{MUSCLE_LABEL[e.muscle]}</span>
                  <span className="tabular">{e.reps}</span>
                  <span className="tabular">RIR {e.rir}</span>
                  {!compact && <span className="tabular">przerwa {e.rest}</span>}
                </div>
                {!compact && e.replaced && (
                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-highlight">
                    <ArrowRightLeft className="h-3 w-3" />
                    zamiast: {e.replaced.name} ({e.replaced.injuries.map((r) => INJURY_LABEL[r]).join(", ")})
                  </div>
                )}
                {!compact && e.note && <div className="mt-1 text-[11px] text-subtle">{e.note}</div>}
              </div>
              {swap && options.length > 1 && (
                <Select value={e.exerciseId} onValueChange={(v) => swap.onSwap(e.swapKey, v === AUTO ? null : v)}>
                  <SelectTrigger
                    className="h-7 w-auto shrink-0 gap-1 border-2 border-frame bg-secondary px-2 text-[11px] font-medium uppercase text-muted-foreground hover:text-foreground"
                    aria-label={`Zamień ćwiczenie: ${e.name}`}
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    <span>Zamień</span>
                  </SelectTrigger>
                  <SelectContent>
                    {e.swapped && <SelectItem value={AUTO}>Dobierz automatycznie</SelectItem>}
                    {options.map((o) => {
                      const risk = o.risk.filter((r) => swap.injuries.includes(r));
                      return (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                          {risk.length > 0 && ` — ryzyko: ${risk.map((r) => INJURY_LABEL[r]).join(", ")}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </li>
          );
        })}
        {session.finisher && (
          <li className="flex items-center gap-2 px-4 py-2.5 text-xs text-highlight">
            <Flame className="h-3.5 w-3.5" />
            {session.finisher}
          </li>
        )}
      </ul>
    </div>
  );
}
