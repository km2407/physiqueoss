import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ALL_MUSCLES, MUSCLE_LABEL } from "@/lib/physique/labels";
import { METHOD_BY_ID, resolveMethod } from "@/lib/physique/methods";
import { autoDayName, DAY_LABELS, effectiveSchedule } from "@/lib/physique/plan";
import { usePhysique } from "@/lib/physique/store";
import type { Muscle, ScheduleDay } from "@/lib/physique/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FULL_DAY = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

export function ScheduleEditor() {
  const { active, updateClient } = usePhysique();
  const { days, source } = effectiveSchedule(active);
  const method = METHOD_BY_ID[resolveMethod(active)];

  const write = (next: ScheduleDay[]) => {
    const sorted = [...next].sort((a, b) => a.weekday - b.weekday);
    updateClient(active.id, { customSchedule: sorted, days: sorted.length });
  };

  const toggleDay = (weekday: number) => {
    const exists = days.some((d) => d.weekday === weekday);
    if (exists) {
      if (days.length <= 1) {
        toast.error("Zostaw co najmniej jeden dzień treningowy.");
        return;
      }
      write(days.filter((d) => d.weekday !== weekday));
    } else {
      write([...days, { weekday, name: "", muscles: [] }]);
    }
  };

  const toggleMuscle = (weekday: number, m: Muscle) =>
    write(
      days.map((d) => {
        if (d.weekday !== weekday) return d;
        const muscles = d.muscles.includes(m) ? d.muscles.filter((x) => x !== m) : [...d.muscles, m];
        // Muscles changed, so the copied exercise slots no longer apply and the old name may be wrong.
        return { weekday: d.weekday, name: d.slots ? "" : d.name, muscles };
      }),
    );

  const rename = (weekday: number, name: string) =>
    write(days.map((d) => (d.weekday === weekday ? { ...d, name: name.slice(0, 40) } : d)));

  return (
    <div id="rozklad" className="space-y-3 scroll-mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Partie w poszczególne dni</span>
          {source === "custom" && <Badge variant="soft">Ręczny układ</Badge>}
          {source === "preset" && <Badge variant="muted">{method.name}</Badge>}
          {source === "auto" && <Badge variant="muted">Automatycznie · {method.name}</Badge>}
        </div>
        {source === "custom" && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateClient(active.id, { customSchedule: undefined, days: method.preset?.length ?? active.days })}>
            <RotateCcw /> Przywróć układ metodyki
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Włącz lub wyłącz dzień i zaznacz partie, które chcesz w nim trenować. Ćwiczenia i serie dobiorą się same.
      </p>
      <div className="divide-y divide-border overflow-hidden rounded-md border border-border-strong">
        {DAY_LABELS.map((label, weekday) => {
          const d = days.find((x) => x.weekday === weekday);
          return (
            <div key={label} className={cn("flex flex-col gap-2.5 px-3 py-3 sm:flex-row sm:items-start", d ? "bg-primary/[0.03]" : "bg-transparent")}>
              <div className="flex w-full items-center gap-3 sm:w-52 sm:shrink-0">
                <Switch checked={!!d} onCheckedChange={() => toggleDay(weekday)} aria-label={`${FULL_DAY[weekday]}: trening`} />
                <div className="min-w-0 flex-1">
                  <div className={cn("text-sm", d ? "font-medium" : "text-muted-foreground")}>{FULL_DAY[weekday]}</div>
                  {!d && <div className="text-[11px] text-subtle">Wolne</div>}
                </div>
              </div>
              {d && (
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    value={d.name}
                    placeholder={autoDayName(d.muscles)}
                    onChange={(e) => rename(weekday, e.target.value)}
                    aria-label={`Nazwa treningu: ${FULL_DAY[weekday]}`}
                    className="h-8 text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_MUSCLES.map((m) => {
                      const on = d.muscles.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleMuscle(weekday, m)}
                          className={cn(
                            "rounded-md border px-2 py-1 text-[11px] transition-colors",
                            on ? "border-primary/40 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
                          )}
                        >
                          {MUSCLE_LABEL[m]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
