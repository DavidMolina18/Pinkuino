# Netlify SPA fallback tracking

Implement the authorized local delivery fix so direct HTTP requests to `/admin` and `/login` receive the SPA entry HTML rather than a hosting 404. These are separate existing client routes; no combined route is in scope.

## Scope and authorization

- Authorized: local delivery configuration, Node regression tests, hosting documentation, and local verification only.
- Not authorized: commits, push, deployment, remote execution or probes, credential discovery, authenticated sessions, or reading/disclosing environment values.
- Preserve router, Vite configuration, Supabase client, catalog behavior, and unrelated code. Document Netlify build-time variable names only: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- TDD is not enabled by project configuration. Use the ordinary Node test runner through `npm.cmd test`; use `npm.cmd run build` because PowerShell blocks `npm.ps1`.
- Parent RDD is enabled. The parent owns the later review boundary; this worker must not invoke review commands. Local T1–T3 implementation is explicitly authorized. No SDD lifecycle is requested.

## Verified starting point

| Evidence | Finding |
|---|---|
| Git HEAD | `b612873` (`fix: spa redirects`); both root `_redirects` and root `netlify.toml` are tracked. |
| `netlify.toml` | Existing valid `[[redirects]]` rule: `from = "/*"`, `to = "/index.html"`, `status = 200`; no forced rewrite. Build command and publish directory are implicit. |
| Root `_redirects` | Contains the SPA fallback, but is outside Vite's public asset directory and is not automatically copied into the build output. Confirm the output artifact in T3. |
| `vite.config.js` | React plugin only; no base, public directory, or output overrides. Keep the default root base, `public`, and `dist` behavior. |
| `src/Routes.jsx` | `BrowserRouter` without a basename; existing root routes are `/`, `/login`, and `/admin`, plus a client-side not-found route. No router change is needed for HTTP fallback. |
| `src/services/supabase.js` | Reads exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, with no alternate-value fallback. No client edit is needed. |
| `package.json` | Test command is `node --test tests/*.test.js`; build is `vite build`; lint is `eslint .`. |
| Existing verification record | Known lint failure: `src/components/Catalog/ProductCard.jsx:9:9`, unused `handleWhatsAppClick`. Not rerun during tracking and not in scope to fix. |
| Deployment evidence | The remote deployment cause is not proven. A local artifact fix does not prove the active Netlify deployment or its settings. No remote inspection performed. |

CodeGraph was initialized as required; `codegraph.cmd status` reported an up-to-date index. Its `netlify` query returned no results, so delivery files were inspected directly. Initialization created untracked `.codegraph/` tool metadata, not application implementation.

## Stable tasks

### T1 — Fix delivery configuration — completed

- Move root `_redirects` to `public/_redirects` with exactly `/* /index.html 200` followed by a newline; do not leave a duplicate root file.
- Add root `netlify.toml` build settings: command `npm run build`, publish `dist`.
- Preserve the existing nonforced HTTP 200 rewrite to `/index.html`; do not add `force = true` or change routing semantics.
- Acceptance: the tracked source fallback is under `public/`, the root copy is absent, and explicit build/publish settings coexist with the unchanged rewrite.
- Rollback boundary: restore the original root `_redirects` and original TOML; leave router, Vite, and application behavior unchanged.
- Evidence: moved the source to `public/_redirects` with exact `/* /index.html 200\n`; removed the root copy. Added `[build]` command/publish before the unchanged nonforced rewrite. Source readback confirmed the configuration; build-copy verification remains T3.

### T2 — Add regression coverage and hosting guidance — completed

- Add deterministic local Node regression coverage using the existing runner, with no network or new credentials. Cover fallback location/content, explicit build/publish settings, and preservation of the nonforced rewrite.
- Update hosting documentation with the build/publish contract, direct-request fallback behavior, and exact Netlify build-time Supabase variable names. Never include values or suggest a privileged/service-role key.
- Explain the distinction between HTTP fallback, client routes (`/login`, `/admin`), and Supabase build-time configuration. Do not claim the deployment cause is established.
- Acceptance: focused tests pass and the guide states the local verification path and remote-verification limitation.
- Rollback boundary: new regression tests and hosting-doc edits only; keep behavior tests and documentation with the delivery fix as one cohesive work unit if commits are later authorized.
- Evidence: added three Node tests in `tests/netlify.test.js`; Vite configuration is resolved with `envFile: false`, without a build or artifact dependency. Updated the existing setup guide with Netlify settings, manual `dist` upload, build-time variable names/rebuild requirements, and remote-evidence limitations.
- Focused command: `node --test tests/netlify.test.js` initially exited 1 (2 pass, 1 fail) because Vite normalizes Windows paths to forward slashes. Normalized both compared paths with Node `resolve`; rerun exited 0 (3 pass, 0 fail/skipped). This was an ordinary implementation check, not a required RED cycle.

### T3 — Verify local delivery artifacts — completed with baseline lint blocker

- Run `npm.cmd test`, `npm.cmd run build`, `npm.cmd run lint`, and `git diff --check`; record exact commands, exit statuses, and results.
- After the build, verify `dist/_redirects` has the exact fallback and `dist/index.html` exists as the SPA entry artifact. Record artifact inspection evidence, not merely build success.
- Separate the known unused-handler lint failure from new failures. Report any new failure without expanding scope into unrelated fixes.
- Runtime boundary: local build/artifact verification only. Live Netlify HTTP status/content, browser behavior, and deployed environment settings remain unverified because deployment/probes are not authorized. A Vite dev-server response is not Netlify proof.
- Acceptance: build and regression tests pass, both output artifacts are verified, diff checks pass, and lint is either clean or explicitly reports only the known baseline blocker.
- Rollback boundary: verification evidence and generated local build output; do not undo unrelated source changes or remove regression coverage to hide a failure.

#### Observed local verification

| Command/check | Exit/result |
|---|---|
| `npm.cmd test` (before build) | Exit 0; 30 tests passed, 0 failed/cancelled/skipped. |
| `npm.cmd run build` | Exit 0; Vite 8.0.14, 95 modules transformed, `dist/index.html` plus CSS/JS generated. |
| `npm.cmd run lint` | Exit 1; only `src/components/Catalog/ProductCard.jsx:9:9`, unused `handleWhatsAppClick` (`no-unused-vars`); 1 error, 0 warnings. Existing unrelated code preserved. |
| `git diff --check` | Exit 0; only Git LF-to-CRLF notices for tracked edited files. |
| `git diff --exit-code -- src vite.config.js package.json package-lock.json` | Exit 0, no output; application, router, Vite, client, and dependency manifests unchanged. |
| `cmd.exe /c fc /b public\_redirects dist\_redirects` | Exit 0; binary comparison reported no differences. Source test also asserts exact `/* /index.html 200\n`. |
| Artifact reads | Read `public/_redirects`, `dist/_redirects`, and `dist/index.html`; both rules contain exactly `/* /index.html 200` followed by a newline. HTML references `/assets/index-BiPGUO-R.js`, `/assets/index-D9OxLtAK.css`, and `/favicon.svg`. |
| File existence | `Test-Path -LiteralPath` with `-PathType Leaf` returned `True` for `dist/index.html` and all three referenced assets; `dist/assets` listing confirms the JS/CSS files. |
| `git check-ignore dist/_redirects dist/index.html` | Exit 0; both generated artifacts remain ignored, not force-added. |

The local artifact-copy defect is corrected; remote deployment cause and live HTTP/browser/auth behavior remain unverified. No live probes, credentials, environment-value inspection, commits, push, or deployment occurred. Existing `.codegraph/` metadata is preserved. All implementation normalization is finished; the parent owns subsequent review. Task evidence is recorded before final candidate freeze; any required source correction must trigger repeated verification.

## Progress and review checks

- [x] Read `work-unit-commits` and `cognitive-doc-design` skills before creating this artifact.
- [x] Inspect local tracked configuration and route/environment-variable names without reading environment values.
- [x] Record scope, acceptance, rollback, verification boundaries, and stable task identifiers.
- [x] T1 delivery configuration implemented.
- [x] T2 regression tests and hosting documentation completed.
- [x] T3 commands and artifact checks completed with exact evidence.
- [ ] Parent-owned RDD review of the final candidate, later and outside this worker's scope.

The 400-authored-line review guideline is advisory here, not a hard cap or a reason to compress code, omit tests/docs, or create commits. Treat T1–T3 as one cohesive delivery fix with its tests, docs, and verification; report size honestly and let the parent choose review slicing if needed.

## Persistence and next step

Local locator: `odd/tasks/netlify-spa-fallback.md`. Full-document Engram mirror: project `pinkuino`, topic `odd/netlify-spa-fallback/tasks`. The mirror must contain this entire document, not a locator-only summary; read back both artifacts before handoff.

Next step: return the locally verified T1–T3 candidate and known lint blocker to the parent for its review boundary. Do not run reviews, commit, or contact a deployment. Keep this full document and mirror #120 synchronized and read back before handoff.
