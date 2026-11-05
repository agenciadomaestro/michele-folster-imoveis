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

# Regras de Automação para Agentes (Antigravity)

## Git Automático
- Sempre que qualquer alteração de arquivos ou código for realizada no projeto, o agente DEVE executar automaticamente a sequência completa do Git:
  1. `git add .`
  2. `git commit -m "<mensagem descritiva e concisa>"`
  3. `git push origin main`
- Nunca aguarde o usuário solicitar o push: envie as alterações imediatamente após testar e validar o código.
- Jamais reescreva o histórico já publicado (não utilize force push, amend em commits públicos ou rebase).
