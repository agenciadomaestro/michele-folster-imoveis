<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use the shared agency clock for availability and footer year, with America/Sao_Paulo time and live refresh, so visitor timezones and open tabs do not change business-hour behavior.

# Regras de Automação para Agentes (Antigravity)

## Git Automático
- Sempre que qualquer alteração de arquivos ou código for realizada no projeto, o agente DEVE executar automaticamente a sequência completa do Git:
  1. `git add .`
  2. `git commit -m "<mensagem descritiva e concisa>"`
  3. `git push origin main`
- Nunca aguarde o usuário solicitar o push: envie as alterações imediatamente após testar e validar o código.
- Jamais reescreva o histórico já publicado (não utilize force push, amend em commits públicos ou rebase).

- Persist application records only in Cloud tables; browser storage is reserved for the managed auth session, so devices cannot diverge.
- Authorize staff using protected user_roles and broker_permissions, never names, emails, embedded passwords, or browser flags.
- Keep one root-owned Realtime subscription tied to Query invalidation, including a data-free catalog broadcast for visibility transitions.
- Store WebP files under the real property UUID; serve private property images only after published-photo RLS verification because public buckets are blocked.
- Retire brokers through one atomic database function that transfers ownership before revoking roles, preserving properties and leads.
- Publish property status only after photo persistence succeeds, so incomplete uploads remain retryable drafts.
- Anonymous capture photos use non-overwriting signed upload capabilities for server-generated paths; direct client inserts are denied to isolate submissions.
- Direct property-image reads require active staff and property assignment or explicit global access; published photos remain available through the RLS-checked public image handler.
- Normalize legacy lead stages through the shared CRM mapper and persist canonical Kanban IDs; history stays in the lead timeline so deletion remains atomic without a separate activities table.
- Keep property owner contacts in a separate staff-only table, never in public property rows or catalog responses, to enforce privacy at the data boundary.
- Keep public photo-gallery layout in a dedicated component with a bounded thumbnail window, so photo counts cannot stretch the property page.

- Site visit metrics are insert-only for visitors; visit time changes only through a bounded database function, so anonymous visitors cannot rewrite analytics.
- Shared search results UI lives in components, not route files, so route modules stay code-split.
