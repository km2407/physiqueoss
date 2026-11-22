<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- PhysiqueOS domain logic (methodologies, exercise library, plan builder, fractional volume, energy) lives as pure functions in `src/lib/physique/`; pages only render it. Why: rules stay testable in `plan.test.ts` without the UI.
- The plan is derived on the fly from client interview data (`buildPlan`), never stored. Why: any interview/landmark change must instantly rebuild the plan.
- All app data persists in browser localStorage via `PhysiqueProvider` (no backend, no logins). Why: single-trainer personal tool; user chose on-device storage.
- Gender theming is the `data-gender` attribute (M/K) swapping accent tokens in `src/styles.css`, mirrored on `<html>` for portaled overlays. Why: one switch recolors every component.
- n8n webhooks are sent through the `sendWebhook` server function, not from the browser. Why: avoids CORS on user webhook URLs and keeps the secret header off third-party scripts.
