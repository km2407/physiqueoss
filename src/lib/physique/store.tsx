import { useServerFn } from "@tanstack/react-start";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { blankClient, SAMPLE_CLIENTS } from "./samples";
import type { CheckIn, Client, WebhookLogEntry, WebhookSettings } from "./types";
import { sendWebhook } from "./webhook.functions";
import type { WebhookEvent } from "./payload";

const STORAGE_KEY = "physiqueos:v1";

interface State {
  clients: Client[];
  activeId: string;
  webhook: WebhookSettings;
  log: WebhookLogEntry[];
}

const initialState: State = {
  clients: SAMPLE_CLIENTS,
  activeId: SAMPLE_CLIENTS[0]!.id,
  webhook: {
    url: "",
    secret: "",
    enabled: false,
    planGenerated: true,
    checkinSubmitted: true,
  },
  log: [],
};

interface Ctx extends State {
  active: Client;
  setActive: (id: string) => void;
  addClient: () => string;
  updateClient: (id: string, patch: Partial<Client>) => void;
  removeClient: (id: string) => void;
  addCheckin: (id: string, ci: Omit<CheckIn, "id">) => CheckIn;
  setWebhook: (patch: Partial<WebhookSettings>) => void;
  clearLog: () => void;
  resetDemo: () => void;
  emit: (
    event: WebhookEvent,
    payload: Record<string, unknown>,
    opts?: { force?: boolean; clientName?: string },
  ) => Promise<WebhookLogEntry | null>;
}

const StoreContext = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function PhysiqueProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [loaded, setLoaded] = useState(false);
  const send = useServerFn(sendWebhook);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        if (parsed.clients?.length) setState({ ...initialState, ...parsed });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loaded]);

  const setActive = useCallback((id: string) => setState((s) => ({ ...s, activeId: id })), []);
  const addClient = useCallback(() => {
    const c = blankClient(uid());
    setState((s) => ({ ...s, clients: [...s.clients, c], activeId: c.id }));
    return c.id;
  }, []);
  const updateClient = useCallback((id: string, patch: Partial<Client>) => {
    setState((s) => ({ ...s, clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  }, []);
  const removeClient = useCallback((id: string) => {
    setState((s) => {
      const clients = s.clients.filter((c) => c.id !== id);
      if (clients.length === 0) return s;
      return { ...s, clients, activeId: s.activeId === id ? clients[0]!.id : s.activeId };
    });
  }, []);
  const addCheckin = useCallback((id: string, ci: Omit<CheckIn, "id">) => {
    const full: CheckIn = { ...ci, id: uid() };
    setState((s) => ({
      ...s,
      clients: s.clients.map((c) =>
        c.id === id ? { ...c, weight: ci.weight, checkins: [...c.checkins, full] } : c,
      ),
    }));
    return full;
  }, []);
  const setWebhook = useCallback(
    (patch: Partial<WebhookSettings>) => setState((s) => ({ ...s, webhook: { ...s.webhook, ...patch } })),
    [],
  );
  const clearLog = useCallback(() => setState((s) => ({ ...s, log: [] })), []);
  const resetDemo = useCallback(() => setState(initialState), []);

  const emit = useCallback<Ctx["emit"]>(
    async (event, payload, opts) => {
      const wh = state.webhook;
      if (!opts?.force) {
        if (!wh.enabled || !wh.url) return null;
        if (event === "plan.generated" && !wh.planGenerated) return null;
        if (event === "checkin.submitted" && !wh.checkinSubmitted) return null;
      }
      let entry: WebhookLogEntry;
      if (!wh.url) {
        entry = { id: uid(), at: new Date().toISOString(), event, ok: false, status: null, durationMs: 0, error: "Brak adresu webhooka" };
      } else {
        try {
          const r = await send({ data: { url: wh.url, secret: wh.secret, event, payload } });
          entry = {
            id: uid(),
            at: new Date().toISOString(),
            event,
            ok: r.ok,
            status: r.status,
            durationMs: r.durationMs,
            ...(r.error ? { error: r.error } : {}),
          };
        } catch {
          entry = { id: uid(), at: new Date().toISOString(), event, ok: false, status: null, durationMs: 0, error: "Nieprawidłowy adres webhooka" };
        }
      }
      if (opts?.clientName) entry.clientName = opts.clientName;
      setState((s) => ({ ...s, log: [entry, ...s.log].slice(0, 50) }));
      return entry;
    },
    [state.webhook, send],
  );

  const active = state.clients.find((c) => c.id === state.activeId) ?? state.clients[0]!;

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      active,
      setActive,
      addClient,
      updateClient,
      removeClient,
      addCheckin,
      setWebhook,
      clearLog,
      resetDemo,
      emit,
    }),
    [state, active, setActive, addClient, updateClient, removeClient, addCheckin, setWebhook, clearLog, resetDemo, emit],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function usePhysique() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("usePhysique must be used inside PhysiqueProvider");
  return ctx;
}
