import { createClient } from "@supabase/supabase-js";

/**
 * Service Role クライアント（RLS をバイパス）
 * サーバーサイドのみで使用し、クライアントに露出しないこと。
 * 新規登録時の reserve_profiles 作成フォールバックで使用。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
