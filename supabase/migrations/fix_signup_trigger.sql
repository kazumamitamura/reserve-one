-- Reserve-One: 新規登録時の "Database error saving new user" を修正
-- Supabase SQL Editor で実行してください。
-- 
-- 原因: auth.users のトリガーが RLS でブロックされていた可能性があります。
-- 対策: 1つのトリガーに統合し、search_path を空にして実行コンテキストを明示します。

-- 既存トリガーを削除
DROP TRIGGER IF EXISTS reserve_on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS reserve_set_admin_role_trigger ON auth.users;

-- 既存関数を削除
DROP FUNCTION IF EXISTS public.reserve_ensure_profile();
DROP FUNCTION IF EXISTS public.reserve_set_admin_role();

-- 統合トリガー関数: プロファイル作成 + 管理者メールの場合は role を admin に
CREATE OR REPLACE FUNCTION public.reserve_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text := 'customer';
BEGIN
  -- 管理者メールの場合は admin に
  IF NEW.email IN ('admin@example.com') THEN
    user_role := 'admin';
  END IF;

  INSERT INTO public.reserve_profiles (id, email, role)
  VALUES (NEW.id, COALESCE(NEW.email, ''), user_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- postgres として実行するため、所有者を明示（Supabase では postgres が RLS をバイパス）
ALTER FUNCTION public.reserve_handle_new_user() OWNER TO postgres;

-- service_role からの INSERT を許可（Auth サービスが signup 時に使用）
-- これによりトリガーが RLS でブロックされる場合のフォールバック
DROP POLICY IF EXISTS "reserve_profiles_insert_service_role" ON public.reserve_profiles;
CREATE POLICY "reserve_profiles_insert_service_role"
  ON public.reserve_profiles FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role' OR auth.role() = 'service_role');

-- トリガーを作成
CREATE TRIGGER reserve_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.reserve_handle_new_user();
