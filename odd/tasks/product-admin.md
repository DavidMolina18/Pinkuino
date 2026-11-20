# Product administration tracking

## Corrected contract

Before source edits, removed the previous worker's invented admin authorization requirement and read back the corrected document and full mirror #112. Mutations use only `auth.role() = 'authenticated'`. No admin claim/table/allowlist or registration UI. Disable public signup and manually provision one admin; every authenticated account has write access by design.

Local implementation only; no commits, remote execution/probes, credential discovery or environment disclosure. Preserve `.atl/` and public Spanish catalog `/`. English technical artifacts, neutral Spanish UI. Reuse Supabase singleton. Parent owns final candidate review/consent; no review lifecycle here. CodeGraph previously failed without index; filesystem fallback authorized. Use `npm.cmd`; ordinary tests, not strict TDD. Review-size guidance is not a code-compression target.

## Stable tasks and rollback boundaries

- **T1 — SQL security + setup guide: implemented locally.** `supabase/admin-security.sql` enables catalog RLS, public reads, authenticated product/bucket writes, restrictive legacy-policy guards, real-sequence grants and existing public bucket configuration. `docs/product-admin-setup.md` documents provisioning, assumptions, matrix, SPA fallback, cleanup/races and reviewed rollback. No SQL executed. Rollback: these local artifacts; remote rollback separately reviewed, never disable RLS.
- **T2 — Auth routes preserving `/`: implemented locally.** Router/login/protected admin, getSession + synchronous listener, cleanup/race/error handling, logout. Authentication only. Session store injected for tests. Catalog source unchanged. Rollback: auth/router integration, keep catalog/T1.
- **T3 — Admin CRUD/storage/filter UI: implemented locally.** Joined list/dynamic options, combined filters, accessible validated forms, COP/nullable mini, safe uploads/row proofs/shared-safe cleanup, busy and outcome feedback. Injected service preserves old URLs and reports compensation/cleanup warnings separately from database success. Namespaced CSS; catalog source unchanged. Rollback: admin services/UI/styles, keep T1/T2/catalog.
- **T4 — Automated checks and verification: implemented locally; runtime/security checks explicitly unrun.** 27 deterministic Node service/path/filter/validation/compensation/session and static deliverable tests without network. `docs/product-admin-verification.md` records the unrun runtime matrix. Rollback: harness/tests/evidence; keep behavior tests with work units.

## Observed evidence

- T1 policy/source inspection: product UPDATE includes USING and WITH CHECK; storage guards exempt other buckets; only feature-owned policies dropped. SQL parser/live SQL unrun (no authorized backend).
- `git diff --check`: exit 0 after T1 (new untracked artifacts also inspected directly).
- `npm.cmd install react-router-dom`: exit 0; 4 packages added, 1 changed; audit reports 11 vulnerabilities (4 moderate, 7 high). No audit fix applied; lock maintained.
- Known baseline lint: exit 1 at `src/components/Catalog/ProductCard.jsx:9:9`, unused `handleWhatsAppClick`, 1 error / 0 warnings; do not modify unrelated handler.
- T2: `node --test tests/session.test.js` exit 0, 4/4 pass; `npm.cmd run build` exit 0; `npm.cmd run lint` exit 1, exactly the baseline 1 error / 0 warnings.
- T3: `node --test tests/product.test.js` exit 0, 16/16 pass; build exit 0; diff check exit 0 (Git line-ending warnings only). Initial lint also found new `no-control-regex` in productModel; replaced with code-point validation. Repeated focused tests 16/16 pass and lint exit 1, baseline only. No unexpected outstanding failure.
- T4 final commands after final source edits: `npm.cmd test` exit 0 (27 tests, 27 pass, 0 fail/skipped); `npm.cmd run build` exit 0 (95 modules, Vite 8.0.14); `npm.cmd run lint` exit 1 (baseline below, no new violations); `git diff --check` exit 0 (line-ending warnings only).
- `git diff --exit-code -- src/App.jsx src/components src/services/supabase.js`: exit 0, empty output; catalog and singleton unchanged. `.atl/` remains untracked and untouched. Router installed at 7.18.6; lock contains npm-generated optional dependency resolution changes as well.
- Browser, live auth, SQL policy enforcement and storage scenarios: unrun; no browser tool/authorized remote operation. Mocks/build do not verify live security.

Full outstanding lint failure:

```text
src/components/Catalog/ProductCard.jsx
  9:9  error  'handleWhatsAppClick' is assigned a value but never used  no-unused-vars
✖ 1 problem (1 error, 0 warnings)
```

## Next step

T1–T4 local implementation complete with the known baseline lint blocker and explicit runtime/security evidence gaps. Full document mirrored to `pinkuino` topic `odd/product-admin/tasks` (#112) and read back at each task boundary. Parent reviews the candidate next; no source normalization after that review starts. Authorized operator setup, SQL execution and browser/manual matrices remain future work. No commits or remote operations performed.
