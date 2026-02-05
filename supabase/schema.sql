-- Reserve-One: B2B予約システム MVP スキーマ
-- Single Project, Multi Apps: 全テーブルに reserve_ 接頭辞を使用
-- Supabase SQL Editor で実行してください。

-- ============================================================
-- 1. reserve_profiles テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reserve_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reserve_profiles_role ON public.reserve_profiles(role);

-- ※ reserve_profiles はアプリ側（auth.ts）で Service Role により作成します。
--    auth.users にトリガーは使用しません。

-- ============================================================
-- 2. reserve_slots テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reserve_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_booked boolean NOT NULL DEFAULT false,
  booked_by uuid REFERENCES public.reserve_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT reserve_slots_time_order CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_reserve_slots_start_time ON public.reserve_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_reserve_slots_is_booked ON public.reserve_slots(is_booked);
CREATE INDEX IF NOT EXISTS idx_reserve_slots_booked_by ON public.reserve_slots(booked_by);

-- ============================================================
-- 3. RLS: reserve_profiles
-- ============================================================
ALTER TABLE public.reserve_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reserve_profiles_select_own" ON public.reserve_profiles;
CREATE POLICY "reserve_profiles_select_own"
  ON public.reserve_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "reserve_profiles_select_admin" ON public.reserve_profiles;
CREATE POLICY "reserve_profiles_select_admin"
  ON public.reserve_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reserve_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "reserve_profiles_insert_own" ON public.reserve_profiles;
CREATE POLICY "reserve_profiles_insert_own"
  ON public.reserve_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "reserve_profiles_update_admin" ON public.reserve_profiles;
CREATE POLICY "reserve_profiles_update_admin"
  ON public.reserve_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.reserve_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- 4. RLS: reserve_slots
-- 空き枠は誰でも閲覧可、Adminは全権限、Customerは自分の予約のみ操作
-- ============================================================
ALTER TABLE public.reserve_slots ENABLE ROW LEVEL SECURITY;

-- 全員が枠を閲覧可能（空き枠含む）
DROP POLICY IF EXISTS "reserve_slots_select_all" ON public.reserve_slots;
CREATE POLICY "reserve_slots_select_all"
  ON public.reserve_slots FOR SELECT
  USING (true);

-- Admin: 全スロットの作成・更新・削除
DROP POLICY IF EXISTS "reserve_slots_insert_admin" ON public.reserve_slots;
CREATE POLICY "reserve_slots_insert_admin"
  ON public.reserve_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reserve_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "reserve_slots_update_admin" ON public.reserve_slots;
CREATE POLICY "reserve_slots_update_admin"
  ON public.reserve_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.reserve_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "reserve_slots_delete_admin" ON public.reserve_slots;
CREATE POLICY "reserve_slots_delete_admin"
  ON public.reserve_slots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.reserve_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Customer: 空き枠の予約（is_booked=false を true に、booked_by に自分を設定）
-- または自分の予約のキャンセル（is_booked=true, booked_by=自分 を false に）
DROP POLICY IF EXISTS "reserve_slots_update_customer" ON public.reserve_slots;
CREATE POLICY "reserve_slots_update_customer"
  ON public.reserve_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.reserve_profiles p
      WHERE p.id = auth.uid() AND p.role = 'customer'
    )
    AND (
      (is_booked = false)  -- 空き枠を予約
      OR (booked_by = auth.uid())  -- 自分の予約をキャンセル
    )
  )
  WITH CHECK (true);

-- ※ 管理者ロールは auth.ts で admin@example.com を判定して設定します。
