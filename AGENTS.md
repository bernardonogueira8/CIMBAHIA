<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Ignore routine debugging and unverified changes. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Keep a qualifying candidate through the reporting pass even if you resolve or work around it. A successful fix changes the report outcome; it does not erase the friction that qualified it.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `node node_modules/next/dist/bin/next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
## **Regra de Registro de Missões (History Tracking)**

Sempre que concluir uma missão ou tarefa solicitada, você deve documentar a execução obrigatoriamente seguindo este padrão:

1. **Local de Salvamento:** Acesse ou crie a raiz do diretório `history/`.
2. **Subpasta:** Crie uma subpasta com a data da execução no formato `YYYY-MM-DD` (ex: `history/2026-10-22/`).
3. **Nome do Arquivo:** Crie um arquivo `.md` nomeado com a função principal executada em kebab-case (ex: `criar-processo-agente.md`).
4. **Título do Arquivo:** Use o padrão *Conventional Commits* no título principal (H1). Exemplo: `# feat: criação da regra de histórico para agents`.
5. **Estrutura do Conteúdo:** O arquivo deve ser preenchido exatamente com a seguinte estrutura estruturada:
* **Pergunta/Solicitação:** [A pergunta exata enviada pelo usuário]
* **Planejamento:** [O raciocínio e o passo a passo que você estabeleceu antes de iniciar a execução]
* **Resumo da Execução:** [A resposta final consolidada e o que foi efetivamente construído ou alterado]

Siga este bloco de forma estrita em cada final de interação.

## **Regra de Análise de Segurança (Security Review)**

Antes de fornecer qualquer código final, propor uma arquitetura ou aprovar um Pull Request, você deve executar um checklist de segurança silencioso e incluir uma seção estruturada de **Análise de Segurança** na sua resposta, avaliando os seguintes pontos:

1. **OWASP Top 10:** O código está vulnerável a Injeção (SQL/NoSQL/Comandos), XSS, ou Quebra de Autenticação?
2. **Gestão de Segredos:** Existem credenciais, tokens ou chaves de API hardcoded? (Se sim, substitua por variáveis de ambiente).
3. **Validação e Sanitização:** Todos os inputs de usuários, requisições externas e parâmetros de URL estão sendo validados e sanitizados?
4. **Dependências:** As bibliotecas sugeridas possuem vulnerabilidades conhecidas recentes?
5. **Privilégio Mínimo:** A execução de scripts, conexões de banco de dados e containers Docker estão configurados com o menor privilégio necessário?

Se vulnerabilidades forem encontradas, o código deve ser reescrito com as correções aplicadas e o motivo da mudança documentado.