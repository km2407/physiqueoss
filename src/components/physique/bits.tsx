import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Pill({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-secondary/50 px-2.5 py-1 text-xs",
        className,
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}

export function Stat({ label, value, unit, hint }: { label: string; value: ReactNode; unit?: string; hint?: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="eyebrow">{label}</div>
      <div className="tabular flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function MacroBar({
  label,
  grams,
  kcal,
  share,
  tone,
}: {
  label: string;
  grams: number;
  kcal: number;
  share: number;
  tone: "protein" | "carbs" | "fat";
}) {
  const bar = { protein: "bg-macro-protein", carbs: "bg-macro-carbs", fat: "bg-macro-fat" }[tone];
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-sm", bar)} />
          {label}
        </span>
        <span className="tabular whitespace-nowrap text-xs text-muted-foreground">
          <span className="text-sm font-medium text-foreground">{grams} g</span> · {kcal} kcal
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${Math.round(share * 100)}%` }} />
      </div>
    </div>
  );
}
