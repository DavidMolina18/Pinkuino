# Set up authenticated product administration

Local SQL and application code are delivered, not applied to a remote project. **Every authenticated account has product and `imagenes` write access.** There is no separate administrator role, allowlist, claim, or signup page.

## Operator setup

1. Back up current policies/grants and review existing schema. Local catalog usage establishes `productos(id, nombre_producto, marca_id, categoria_id, precio, precio_mini, imagen_url)`, `marcas(id, nombre, logo_url)` and `categorias(id, nombre)`, with product foreign-key relationships. No schema DDL is invented here. Confirm actual types/defaults, foreign keys and required columns before applying SQL.
2. In Supabase Auth, disable **Allow new users to sign up**, review enabled providers, and manually provision the single administrator email/password. Remove or disable any other existing users, including anonymous-auth users; they also receive the authenticated database role. This is an operational prerequisite, not a UI security control.
3. Confirm an existing `imagenes` bucket and review its allowed MIME types/size limits (UI limit: 5 MiB). Review `supabase/admin-security.sql`, then execute it yourself in the SQL editor. It sets that bucket public. It fails transactionally if the bucket does not exist. Do not paste privileged credentials into this application.
4. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the public anon/publishable client key only. These values are bundled for the browser. Never use a service-role/secret key. Reuse the existing client, then run `npm.cmd install`, `npm.cmd run dev` locally.
5. Visit `/` for the public catalog, `/login` to sign in, and `/admin` to manage products. Configure the eventual host to serve `index.html` for non-asset SPA paths including `/login` and `/admin`; hosting provider is not known, so no provider-specific config is supplied.

## Security boundaries

- RLS is enabled for all three catalog tables. Anonymous/authenticated reads remain allowed. Only authenticated product mutations are granted; brands/categories are read-only through these client roles.
- Named permissive policies provide the requested access. Restrictive write guards AND with legacy permissive policies so a prior broad policy cannot enable anonymous product or target-bucket writes. Only this feature's named policies are replaced. Other buckets' existing write behavior is not granted or revoked by these guards.
- Existing restrictive policies can still deny desired access; inspect them rather than blindly deleting them. Database owners, privileged roles and service-role keys can bypass RLS; they must not reach the browser. Storage already uses Supabase-managed RLS/grants; verify that RLS is enabled on `storage.objects` before deployment.
- Authenticated storage policies intentionally allow modification of **all** objects in `imagenes`, not just an uploader's objects. UI cleanup is more conservative: only managed same-origin paths, no logos, and no known shared image references. Direct API callers still have the requested full bucket access.
- Grants include the real product serial/identity sequence if `pg_get_serial_sequence` finds one. No new sequence or table is created. Preserve SELECT policies: mutation row proofs and Storage operations require reads.

## User-run verification matrix (not executed here)

| Session | Reads | Product create/update/delete | `imagenes` upload/replace/delete |
| --- | --- | --- | --- |
| Signed out / anon key | Catalog + public images allowed | Denied (including legacy permissive policies) | Denied |
| Manually provisioned authenticated account | Allowed | Allowed, with returned affected row | Allowed for existing bucket objects |
| Any other authenticated account | Allowed | Also allowed by design; must not exist in this deployment | Also allowed by design |

Verify brand/category mutations are denied, other buckets' policies unchanged, both old/new UPDATE rows checked, expired sessions fail writes, and anonymous storage listing/public image retrieval as intended. Check `pg_policies` and `pg_class.relrowsecurity` with authorized operator access. Test SQL repeatability in a safe environment. No SQL parser/live database validation has run locally.

## Image and failure behavior

Uploads use uppercase normalized brand/category folders and timestamped sanitized filenames, with `upsert: false`. An edit without a new file keeps the existing URL, even when brand/category changes. A failed product write attempts to remove the new upload and reports incomplete cleanup. A successful replacement or database-first deletion attempts old-image cleanup; cleanup failure is a warning, not a failed database mutation. Foreign, unmanaged, logo and shared images are retained with a warning. A retryable list-refresh error never changes an already reported mutation outcome.

These browser operations are not a transaction. Concurrent editors can race after reference checks or overwrite changes; do not promise atomicity. Storage failures can leave orphaned images. Reconcile them manually after checking current product and brand references; do not automatically purge objects. A network failure can leave a write outcome ambiguous: reload and inspect before retrying.

## Rollback

Revert only the new auth/admin integration and associated local files to remove the UI, preserving the catalog. Database rollback is a separate reviewed operator action: restore backed-up grants and policies, remove only `admin_catalog_read`, `admin_guard_*`, `admin_allow_*` on the three catalog tables and `admin_images_*` on storage objects where this script created them. Keep guards until replacement security is in place; dropping them alone could re-enable unsafe legacy writes. Never disable RLS. Review bucket visibility separately before restoring its previous public flag, because catalog images depend on it.
