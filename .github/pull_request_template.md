## User story

<!-- code-corhuila/library-docs#NN -->

## What changes and why

<!-- A few lines. -->

## How it was tested

<!-- The tests that cover this change, and the result of the ci.yml run. -->

## Promotion trail

<!-- Only for a PR into qa or main: the list of commits re-applied, each with its
own `(cherry picked from commit <sha>)` line. Delete this section for a PR into
develop. -->

## Checklist

- [ ] No secrets committed
- [ ] No HTTP client or session code of this portal's own — only shell/apiClient, shell/session
- [ ] Every screen has its four states: loading, error with retry, empty, data
- [ ] `npm run build` compiles under TypeScript strict mode
