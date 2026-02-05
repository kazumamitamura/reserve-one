-- Reserve-One: auth.users のトリガー削除（新規登録エラー解消）
--
-- マルチアプリ構成ではトリガー名が reserve_one_ の形式です。
-- 実行: Supabase ダッシュボード > SQL Editor で以下を実行

DROP TRIGGER IF EXISTS reserve_one_on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS reserve_one_set_admin_role_trigger ON auth.users;
DROP TRIGGER IF EXISTS reserve_on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS reserve_set_admin_role_trigger ON auth.users;

DROP FUNCTION IF EXISTS public.reserve_one_ensure_profile();
DROP FUNCTION IF EXISTS public.reserve_one_set_admin_role();
DROP FUNCTION IF EXISTS public.reserve_handle_new_user();
DROP FUNCTION IF EXISTS public.reserve_ensure_profile();
DROP FUNCTION IF EXISTS public.reserve_set_admin_role();
