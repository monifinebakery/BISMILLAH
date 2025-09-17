-- Migration: Clean up all references of total_pembelian -> total_nilai
-- This script will:
-- 1) Rewrite functions/views/materialized views/indexes/constraints/policies that reference total_pembelian
--    to use total_nilai instead
-- 2) Drop legacy column purchases.total_pembelian if it exists
-- 3) Optionally ensure an index on purchases(total_nilai)
-- 4) Print verification count of remaining references

BEGIN;

-- 1) Rewrite objects that reference total_pembelian
DO $$
DECLARE
  rf RECORD;   -- functions
  rv RECORD;   -- views
  rmv RECORD;  -- materialized views
  ridx RECORD; -- indexes
  rcon RECORD; -- constraints
  rpol RECORD; -- policies
  roles_list text;
  qual text;
  with_check text;
  newdef text;
  newidx text;
BEGIN
  RAISE NOTICE 'Rewriting functions referencing total_pembelian...';
  FOR rf IN
    SELECT n.nspname AS schemaname, p.proname, pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND pg_get_functiondef(p.oid) ILIKE '%total_pembelian%'
  LOOP
    newdef := replace(rf.definition, 'total_pembelian', 'total_nilai');
    EXECUTE newdef;
    RAISE NOTICE 'Rewrote function %.%()', rf.schemaname, rf.proname;
  END LOOP;

  RAISE NOTICE 'Rewriting views referencing total_pembelian...';
  FOR rv IN
    SELECT schemaname, viewname, definition
    FROM pg_views
    WHERE schemaname = 'public' AND definition ILIKE '%total_pembelian%'
  LOOP
    newdef := replace(rv.definition, 'total_pembelian', 'total_nilai');
    EXECUTE format('CREATE OR REPLACE VIEW %I.%I AS %s', rv.schemaname, rv.viewname, newdef);
    RAISE NOTICE 'Rewrote view %.%', rv.schemaname, rv.viewname;
  END LOOP;

  RAISE NOTICE 'Rewriting materialized views referencing total_pembelian...';
  FOR rmv IN
    SELECT schemaname, matviewname, definition
    FROM pg_matviews
    WHERE schemaname='public' AND definition ILIKE '%total_pembelian%'
  LOOP
    newdef := replace(rmv.definition, 'total_pembelian', 'total_nilai');
    EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %I.%I CASCADE', rmv.schemaname, rmv.matviewname);
    EXECUTE format('CREATE MATERIALIZED VIEW %I.%I AS %s', rmv.schemaname, rmv.matviewname, newdef);
    RAISE NOTICE 'Recreated materialized view %.%', rmv.schemaname, rmv.matviewname;
  END LOOP;

  RAISE NOTICE 'Rewriting indexes referencing total_pembelian...';
  FOR ridx IN
    SELECT schemaname, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname='public' AND indexdef ILIKE '%total_pembelian%'
  LOOP
    newidx := replace(ridx.indexdef, 'total_pembelian', 'total_nilai');
    EXECUTE format('DROP INDEX IF EXISTS %I.%I', ridx.schemaname, ridx.indexname);
    EXECUTE newidx;
    RAISE NOTICE 'Recreated index %.%', ridx.schemaname, ridx.indexname;
  END LOOP;

  RAISE NOTICE 'Rewriting table constraints referencing total_pembelian...';
  FOR rcon IN
    SELECT n.nspname AS schemaname,
           c.relname AS tablename,
           con.conname,
           pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public'
      AND pg_get_constraintdef(con.oid) ILIKE '%total_pembelian%'
  LOOP
    newdef := replace(rcon.def, 'total_pembelian', 'total_nilai');
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', rcon.schemaname, rcon.tablename, rcon.conname);
    EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I %s', rcon.schemaname, rcon.tablename, rcon.conname, newdef);
    RAISE NOTICE 'Recreated constraint % on %.%', rcon.conname, rcon.schemaname, rcon.tablename;
  END LOOP;

  RAISE NOTICE 'Rewriting RLS policies referencing total_pembelian (if any)...';
  FOR rpol IN
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname='public'
      AND (qual ILIKE '%total_pembelian%' OR with_check ILIKE '%total_pembelian%')
  LOOP
    qual := COALESCE(replace(rpol.qual, 'total_pembelian', 'total_nilai'), NULL);
    with_check := COALESCE(replace(rpol.with_check, 'total_pembelian', 'total_nilai'), NULL);
    roles_list := CASE
      WHEN rpol.roles IS NULL THEN 'public'
      ELSE array_to_string(rpol.roles, ', ')
    END;

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', rpol.policyname, rpol.schemaname, rpol.tablename);

    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s %s %s',
      rpol.policyname,
      rpol.schemaname, rpol.tablename,
      CASE WHEN rpol.permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      UPPER(rpol.cmd),
      roles_list,
      COALESCE(format('USING (%s)', qual), ''),
      COALESCE(format('WITH CHECK (%s)', with_check), '')
    );

    RAISE NOTICE 'Recreated policy % on %.%', rpol.policyname, rpol.schemaname, rpol.tablename;
  END LOOP;

  -- 2) Finally, ensure legacy column is gone
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='purchases' AND column_name='total_pembelian'
  ) THEN
    EXECUTE 'ALTER TABLE public.purchases DROP COLUMN IF EXISTS total_pembelian';
    RAISE NOTICE 'Dropped legacy column public.purchases.total_pembelian';
  END IF;

END $$;

-- 3) Optional sanity: ensure index on total_nilai exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='idx_purchases_total_nilai'
  ) THEN
    EXECUTE 'CREATE INDEX idx_purchases_total_nilai ON public.purchases (total_nilai)';
  END IF;
END $$;

-- 4) Verification: count remaining references
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND pg_get_functiondef(p.oid) ILIKE '%total_pembelian%'
    UNION ALL
    SELECT 1 FROM pg_views WHERE schemaname='public' AND definition ILIKE '%total_pembelian%'
    UNION ALL
    SELECT 1 FROM pg_matviews WHERE schemaname='public' AND definition ILIKE '%total_pembelian%'
    UNION ALL
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexdef ILIKE '%total_pembelian%'
    UNION ALL
    SELECT 1 FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND pg_get_constraintdef(con.oid) ILIKE '%total_pembelian%'
    UNION ALL
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND (qual ILIKE '%total_pembelian%' OR with_check ILIKE '%total_pembelian%')
  ) s;
  RAISE NOTICE 'Remaining references to total_pembelian: %', cnt;
END $$;

COMMIT;
