# Product administration verification

Automated checks exercise injected services and session lifecycle without a network or credentials. They do not prove browser rendering, deployed authentication, or SQL enforcement. SQL is delivered only; setup and manual security matrix are in [the setup guide](product-admin-setup.md).

## Local checks

Use `npm.cmd test`, `npm.cmd run build`, `npm.cmd run lint`, and `git diff --check` in the project root. Final observed results are recorded in `odd/tasks/product-admin.md`, mirrored in Engram observation #112. The unrelated baseline unused handler in ProductCard must not be silently fixed.

Tests cover decimal/nullable/zero prices, membership/text/file validation, accent normalization and traversal rejection, simultaneous filters, joined lists, no-upsert uploads, affected-row failures, upload compensation, database-first deletion, shared product/brand references, cleanup warnings, initial sessions, sign-out events, bootstrap races, listener failures and StrictMode-style remounts. Static SQL/router guardrails are explicitly not executable security or UI tests.

## Manual runtime matrix — all unrun here

| Scenario | Expected result | Evidence gap |
| --- | --- | --- |
| Public `/`, sidebar/search/categories/new products | Existing catalog works without sign-in | No browser tool used; catalog files unchanged |
| Signed-out direct `/admin`, reload `/login` | Redirect to login; SPA fallback serves index | Hosting/browser not exercised |
| Correct/incorrect email/password, expired session | Admin after success; generic error otherwise; writes denied when expired | No live auth calls authorized |
| Logout succeeds/fails, auth changes in another tab | Gate closes on sign-out; error/retry on failure | Session events mocked only |
| Create/edit with image, without replacement, mini zero | Validated fields and prices; preview; correct persisted data | Service mocked; file picker/render untested |
| Delete confirm/cancel, shared/foreign/logo image | Confirmation; DB first; safe retention/warning | No browser/storage calls authorized |
| Upload/database/cleanup/list-refresh failure | Clear failure or success + warning; no false atomicity | Service failure paths mocked |
| Anonymous and authenticated API/SQL/storage operations | Setup matrix enforced, legacy permissive writes guarded | SQL not applied or parsed against a live database |

## Remaining operational work

An authorized operator must confirm the existing remote schema, disable signup/provision the sole account, review/apply SQL, configure SPA fallback and execute the manual matrices. `npm.cmd install react-router-dom` reported 11 dependency audit vulnerabilities (4 moderate, 7 high); no automatic audit fix was authorized or applied. Assess those separately before deployment. Browser concurrency and cross-service transactions remain limitations, not promises made by the tests.
