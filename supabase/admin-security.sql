-- Deliverable only: review in the Supabase SQL editor before executing.
-- Contract: ALL authenticated accounts are administrators. Disable public signup.
begin;

alter table public.productos enable row level security;
alter table public.marcas enable row level security;
alter table public.categorias enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.productos, public.marcas, public.categorias to anon, authenticated;
grant insert, update, delete on public.productos to authenticated;
revoke insert, update, delete on public.productos from anon;
revoke insert, update, delete on public.marcas, public.categorias from anon, authenticated;

-- Resolve an actual serial/identity sequence, if one exists; do not invent one.
do $$
declare sequence_name text;
begin
  sequence_name := pg_get_serial_sequence('public.productos', 'id');
  if sequence_name is not null then
    execute format('grant usage, select on sequence %s to authenticated', sequence_name);
  end if;
end $$;

-- Only replace policies owned by this feature. Restrictive guards are ANDed
-- with every permissive policy, including legacy policies we do not own.
do $$
declare
  table_name text;
  operation text;
  policy_name text;
  predicate text;
begin
  foreach table_name in array array['productos', 'marcas', 'categorias'] loop
    execute format('drop policy if exists admin_catalog_read on public.%I', table_name);
    execute format('create policy admin_catalog_read on public.%I for select to anon, authenticated using (true)', table_name);
    foreach operation in array array['insert', 'update', 'delete'] loop
      policy_name := 'admin_guard_' || operation;
      predicate := case when table_name = 'productos'
        then '(select auth.role()) = ''authenticated''' else 'false' end;
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
      execute format('create policy %I on public.%I as restrictive for %s to public %s',
        policy_name, table_name, operation,
        case operation
          when 'insert' then 'with check (' || predicate || ')'
          when 'delete' then 'using (' || predicate || ')'
          else 'using (' || predicate || ') with check (' || predicate || ')'
        end);
      if table_name = 'productos' then
        policy_name := 'admin_allow_' || operation;
        execute format('drop policy if exists %I on public.productos', policy_name);
        execute format('create policy %I on public.productos for %s to authenticated %s',
          policy_name, operation,
          case operation
            when 'insert' then 'with check (' || predicate || ')'
            when 'delete' then 'using (' || predicate || ')'
            else 'using (' || predicate || ') with check (' || predicate || ')'
          end);
      end if;
    end loop;
  end loop;
end $$;

-- Existing bucket only. Abort rather than invent storage configuration.
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'imagenes') then
    raise exception 'Existing imagenes bucket required; create/review it in Storage first';
  end if;
end $$;
update storage.buckets set public = true where id = 'imagenes';

drop policy if exists admin_images_read on storage.objects;
create policy admin_images_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'imagenes');

do $$
declare
  operation text;
  policy_name text;
  predicate text;
  kind text;
begin
  foreach operation in array array['insert', 'update', 'delete'] loop
    foreach kind in array array['guard', 'allow'] loop
      policy_name := 'admin_images_' || kind || '_' || operation;
      predicate := case when kind = 'guard'
        then '(bucket_id <> ''imagenes'' or (select auth.role()) = ''authenticated'')'
        else '(bucket_id = ''imagenes'' and (select auth.role()) = ''authenticated'')' end;
      execute format('drop policy if exists %I on storage.objects', policy_name);
      execute format('create policy %I on storage.objects as %s for %s to %s %s',
        policy_name,
        case when kind = 'guard' then 'restrictive' else 'permissive' end,
        operation,
        case when kind = 'guard' then 'public' else 'authenticated' end,
        case operation
          when 'insert' then 'with check (' || predicate || ')'
          when 'delete' then 'using (' || predicate || ')'
          else 'using (' || predicate || ') with check (' || predicate || ')'
        end);
    end loop;
  end loop;
end $$;
commit;
