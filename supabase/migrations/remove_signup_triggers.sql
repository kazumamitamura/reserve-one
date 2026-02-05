-- Reserve-One: 新規登録をアプリ側で行うため、トリガーを削除
-- Supabase SQL Editor で実行してください。
--
-- マルチアプリ構成ではトリガー名が reserve_one_ になります。
-- 実行後、アプリが Service Role で reserve_profiles を作成します。

-- Reserve-One 用トリガーを削除（両方の命名パターンに対応）
DROP TRIGGER IF EXISTS reserve_one_on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS reserve_one_set_admin_role_trigger ON auth.users;
DROP TRIGGER IF EXISTS reserve_on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS reserve_set_admin_role_trigger ON auth.users;

-- 関連関数を削除
DROP FUNCTION IF EXISTS public.reserve_one_ensure_profile();
DROP FUNCTION IF EXISTS public.reserve_one_set_admin_role();
DROP FUNCTION IF EXISTS public.reserve_handle_new_user();
DROP FUNCTION IF EXISTS public.reserve_ensure_profile();
DROP FUNCTION IF EXISTS public.reserve_set_admin_role();
