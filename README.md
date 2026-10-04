# lms-circulation-portal

> Circulation bounded context: web UI (remote)

Part of the **LMS Library** distributed system — team `lms-library`, Grupo 2.
Governance and documentation live in [`library-docs`](https://github.com/code-corhuila/library-docs).

Implements HU-06 (register loan), HU-07 (return + history), and HU-08 (overdue report) against
`lms-circulation-api`, which now implements all four endpoints (migrated from
`lms-library-sandbox`, see that repo's README).

## Structure

Follows `rules/2-anexos/H-front.md` (the course's own repository norm): this portal is composed
into `lms-front` as a **Module Federation remote**, not run as an unrelated standalone app.

```
src/
├── pages/loans/
│   ├── LoanFormPage.tsx      → HU-06 register loan
│   ├── LoansListPage.tsx     → HU-07 — lists loans (status filter), registers returns
│   └── OverdueLoansPage.tsx  → HU-08 — read-only overdue report (days overdue)
├── components/ui/            → Button, Card, EmptyState — still local; only the HTTP client and
│                               session are required to live in the container
├── routes.tsx                → exposed to lms-front via vite.config.ts's federation({ exposes })
├── shell.d.ts                → ambient types for shell/apiClient, shell/session
├── App.tsx                   → standalone preview only, reuses routes.tsx
├── bootstrap.tsx             → the real entry point; main.tsx dynamically imports this
└── types/                    → Loan, Paginated, PaginatedMeta
```

`LoansListPage` and `OverdueLoansPage` show the student/book by ID, not name/title — there is no
cross-service lookup here yet (would mean calling `lms-membership-api`/`lms-catalog-api` per row);
acceptable for now since the Administrator already knows the ID they registered.

**No HTTP client or session code of this portal's own anymore.** `src/lib/api.ts`/`src/lib/auth.ts`
are gone; pages import `apiClient`/`ShellError` from `shell/apiClient` and `getToken`/`isAuthenticated`
from `shell/session`, resolved at runtime by `@module-federation/vite` against `lms-front`'s dev
server (port 3000) — this portal runs on port 3003.

**Idempotent loan registration.** `LoanFormPage` sends `Idempotency-Key` — matters more here than
in the other two portals: without it, a retried registration after a network cut could decrement
a book's available copies twice for one intent. `lms-circulation-api` honors it durably now
(`internal/adapter/out/persistence.IdempotencyStore`, backed by `lms-circulation-db`'s
`idempotency_keys` collection).

**Running this portal alone (`npm run dev`) no longer fully works in isolation** — same trade-off
as the other two portals, correct per the norm, not a bug.

## Known gaps

- Not yet run against a real lms-front host: the portal builds and lints on every commit, but the shell/apiClient and shell/session remotes have not been exercised end to end.

## Migration scope

**Comes from** `lms-library` → `frontend/src/pages/loans/{LoansListPage,OverdueLoansPage}.tsx`
— both were still `EmptyState` placeholders there (no backend existed). Since
`lms-circulation-api` now implements all of HU-06/07/08, all three pages here are real,
working screens: `LoanFormPage` is new (not present in `lms-library` — built here to match the
pattern already used by `StudentFormPage`/`BookFormPage`), and `LoansListPage`/`OverdueLoansPage`
were rebuilt from their placeholder versions to call the real endpoints.

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
