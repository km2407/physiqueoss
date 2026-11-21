import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Pause, Pencil, Play, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { CheckinDialog } from "@/components/physique/CheckinDialog";
import { PageHeader, Panel } from "@/components/physique/AppShell";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { energy } from "@/lib/physique/calc";
import { GOAL_LABEL, INJURY_LABEL, LEVEL_LABEL } from "@/lib/physique/labels";
import { methodLabel } from "@/lib/physique/methods";
import { usePhysique } from "@/lib/physique/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/podopieczni")({
  head: () => ({
    meta: [
      { title: "Podopieczni · PhysiqueOS" },
      { name: "description", content: "Lista podopiecznych: szybkie przełączanie, cel, status, check-iny i edycja profilu." },
      { property: "og:title", content: "Podopieczni · PhysiqueOS" },
      { property: "og:description", content: "Zarządzanie podopiecznymi i historią check-inów." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Clients,
});

function Clients() {
  const { clients, active, setActive, addClient, removeClient, updateClient } = usePhysique();
  const navigate = useNavigate();
  const history = [...active.checkins].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Podopieczni"
        title={`${clients.length} ${clients.length === 1 ? "podopieczny" : "podopiecznych"}`}
        description="Kliknij kartę, aby przełączyć podopiecznego. Motyw kolorystyczny zmienia się automatycznie wg płci."
        actions={
          <Button
            variant="glow"
            onClick={() => {
              addClient();
              navigate({ to: "/wywiad" });
            }}
          >
            <Plus /> Nowy podopieczny
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {clients.map((c) => {
          const isActive = c.id === active.id;
          const sorted = [...c.checkins].sort((a, b) => a.date.localeCompare(b.date));
          const delta = sorted.length > 1 ? Math.round((sorted[sorted.length - 1]!.weight - sorted[0]!.weight) * 10) / 10 : null;
          return (
            <div
              key={c.id}
              data-gender={c.gender}
              className={cn("panel flex flex-col gap-3 p-4 transition-colors", isActive ? "border-primary/40 shadow-glow" : "hover:border-border-strong")}
            >
              <button type="button" onClick={() => setActive(c.id)} className="flex items-start gap-3 text-left">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/10 text-sm font-semibold text-primary">
                  {c.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium">{c.name}</span>
                    {isActive && <Badge variant="soft">Wybrany</Badge>}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {c.gender} · {c.age} lat · {LEVEL_LABEL[c.level]}
                  </span>
                </span>
              </button>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Cel</div>
                  <div className="font-medium">{GOAL_LABEL[c.goal]}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Masa</div>
                  <div className="tabular flex items-center gap-1 font-medium">
                    {c.weight} kg
                    {delta !== null && delta !== 0 && (
                      <span className="flex items-center text-[10px] text-primary">
                        {delta < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {delta > 0 ? "+" : ""}
                        {delta}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Kcal</div>
                  <div className="tabular font-medium">{energy(c).target}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="muted">{methodLabel(c.method, c)}</Badge>
                <Badge variant="muted">{c.days} dni/tydz.</Badge>
                {c.injuries.map((i) => (
                  <Badge key={i} variant="warning">{INJURY_LABEL[i]}</Badge>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => updateClient(c.id, { status: c.status === "active" ? "paused" : "active" })}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", c.status === "active" ? "bg-primary" : "bg-subtle")} />
                  {c.status === "active" ? "Aktywny" : "Wstrzymany"}
                  {c.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </button>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setActive(c.id)} asChild>
                    <Link to="/wywiad" onClick={() => setActive(c.id)}>
                      <Pencil /> Edytuj
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-destructive" disabled={clients.length <= 1} aria-label={`Usuń ${c.name}`}>
                        <Trash2 />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-border-strong bg-popover">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Usunąć {c.name}?</AlertDialogTitle>
                        <AlertDialogDescription>Wywiad, check-iny i ustawienia planu zostaną usunięte z tego urządzenia.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => {
                            removeClient(c.id);
                            toast.success(`Usunięto: ${c.name}`);
                          }}
                        >
                          Usuń
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Panel
        title={`Historia check-inów · ${active.name}`}
        action={
          <CheckinDialog
            trigger={
              <Button size="sm" variant="subtle" className="h-7 text-xs">
                <Plus /> Dodaj check-in
              </Button>
            }
          />
        }
      >
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Brak check-inów. Dodaj pierwszy pomiar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-normal">Data</th>
                  <th className="pb-2 text-right font-normal">Masa</th>
                  <th className="pb-2 text-right font-normal">Talia</th>
                  <th className="pb-2 pl-6 font-normal">Notatka</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="tabular py-2 text-muted-foreground">{h.date.split("-").reverse().join(".")}</td>
                    <td className="tabular py-2 text-right font-medium">{h.weight} kg</td>
                    <td className="tabular py-2 text-right text-muted-foreground">{h.waist ? `${h.waist} cm` : "—"}</td>
                    <td className="py-2 pl-6 text-xs text-muted-foreground">{h.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
