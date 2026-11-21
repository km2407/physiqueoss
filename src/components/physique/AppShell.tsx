import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Plus,
  Users,
  Webhook,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { GOAL_LABEL } from "@/lib/physique/labels";
import { usePhysique } from "@/lib/physique/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Plan", icon: LayoutDashboard },
  { to: "/podopieczni", label: "Podopieczni", icon: Users },
  { to: "/wywiad", label: "Wywiad", icon: ClipboardList },
  { to: "/objetosc", label: "Objętość", icon: Activity },
  { to: "/integracje", label: "Integracje n8n", icon: Webhook },
  { to: "/pomoc", label: "Pomoc", icon: BookOpen },
] as const;

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-1">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-glow">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M4 15V9M8 18V6M16 18V6M20 15V9M8 12h8" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">PhysiqueOS</span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { clients, active, setActive, addClient } = usePhysique();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full flex-col gap-6 px-3 py-4">
      <Logo />

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ to, label, icon: Icon }) => {
          const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between px-2.5">
          <span className="eyebrow">Podopieczni</span>
          <button
            type="button"
            onClick={() => {
              addClient();
              onNavigate?.();
            }}
            className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            aria-label="Dodaj podopiecznego"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-0.5 overflow-y-auto">
          {clients.map((c) => {
            const isActive = c.id === active.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                data-gender={c.gender}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-sidebar-accent",
                  isActive && "bg-sidebar-accent",
                )}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold",
                    isActive ? "border-primary/40 bg-primary/15 text-primary" : "border-border-strong text-muted-foreground",
                  )}
                >
                  {c.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{c.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {GOAL_LABEL[c.goal]} · {c.days} dni
                  </span>
                </span>
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", c.status === "active" ? "bg-primary" : "bg-subtle")}
                  title={c.status === "active" ? "Aktywny" : "Wstrzymany"}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-sidebar-border px-2.5 pt-3 text-[11px] text-subtle">
        PhysiqueOS <span className="text-muted-foreground">by Jakub Majchrowski</span>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { active } = usePhysique();
  const [open, setOpen] = useState(false);

  // Portaled overlays (dialogs, selects) live outside the shell, so mirror the theme on <html>.
  useEffect(() => {
    document.documentElement.dataset["gender"] = active.gender;
  }, [active.gender]);

  return (
    <div data-gender={active.gender} className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
        <Logo />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">Nawigacja</SheetTitle>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  icon,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel flex flex-col", className)}>
      {title && (
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-[13px] font-medium text-foreground">
            {icon && <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
            {title}
          </h2>
          {action}
        </div>
      )}
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}
