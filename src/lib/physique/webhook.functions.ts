import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  url: z
    .string()
    .url()
    .max(2000)
    .refine((u) => /^https?:\/\//i.test(u), "Adres musi zaczynać się od http(s)://"),
  secret: z.string().max(500),
  event: z.string().min(1).max(100),
  payload: z.record(z.any()),
});

export const sendWebhook = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }) => {
    const started = Date.now();
    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "x-physiqueos-event": data.event,
      };
      if (data.secret) headers["X-Webhook-Secret"] = data.secret;
      const res = await fetch(data.url, {
        method: "POST",
        headers,
        body: JSON.stringify(data.payload),
        redirect: "manual",
        signal: AbortSignal.timeout(10000),
      });
      const ok = res.status >= 200 && res.status < 300;
      return {
        ok,
        status: res.status,
        durationMs: Date.now() - started,
        error: ok ? null : `Serwer odpowiedział kodem ${res.status}`,
      };
    } catch (err) {
      console.error("webhook send failed", err);
      return {
        ok: false,
        status: null,
        durationMs: Date.now() - started,
        error: "Nie udało się połączyć z adresem webhooka",
      };
    }
  });
