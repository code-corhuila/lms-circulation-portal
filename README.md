# lms-circulation-portal

> Circulation bounded context: web UI (remote)

Part of the **LMS Library** distributed system — team `lms-library`, Grupo 2.
Governance and documentation live in [`library-docs`](https://github.com/code-corhuila/library-docs).

## Migration scope

**Comes from** `lms-library` → `frontend/src/`pages/loans/{LoansListPage,OverdueLoansPage}.tsx``.

> These screens already exist but **have no backend**: neither `lms-circulation-api` nor the gateway
> route for `/api/v1/loans` exists yet. Expect to wire them up, not just move them.

Consume the shared HTTP client and session from `lms-front`; do not re-implement them here.

The full map lives in `library-docs`.

---

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `library-docs`.
