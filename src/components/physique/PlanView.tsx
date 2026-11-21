import { AlertTriangle, ArrowRightLeft, Flame } from "lucide-react";
import { INJURY_LABEL, MUSCLE_LABEL } from "@/lib/physique/labels";
import { DAY_LABELS, type Plan } from "@/lib/physique/plan";
import { cn } from "@/lib/utils";

export function WeekStrip({ plan }: { plan: Plan }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {DAY_LABELS.map((d, i) => {
        const s = plan.sessions.find((x) => x.weekday === i);
        return (
          <div
            key={d}
            className={cn(
              "flex min-h-16 flex-col justify-between rounded-md border px-2 py-1.5",
              s ? "border-primary/25 bg-primary/[0.07]" : "border-border bg-transparent",
            )}
          >
            <span className="eyebrow">{d}</span>
            <span className={cn("text-[11px] leading-tight", s ? "font-medium text-foreground" : "text-subtle")}>
              {s ? s.name : "Wolne"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SessionCard({ session, compact }: { session: Plan["sessions"][number]; compact?: boolean }) {
  const total = session.exercises.reduce((a, e) => a + e.sets, 0);
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="eyebrow text-primary">{session.dayLabel}</span>
          <span className="text-sm font-medium">{session.name}</span>
        </div>
        <span className="tabular text-xs text-muted-foreground">{total} serii</span>
      </div>
      <ul className="divide-y divide-border">
        {session.exercises.map((e) => (
          <li key={e.key} className="flex items-start gap-3 px-4 py-2.5">
            <span className="tabular mt-0.5 w-8 shrink-0 text-sm font-semibold text-primary">{e.sets}×</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm text-foreground">{e.name}</span>
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
          </li>
        ))}
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
