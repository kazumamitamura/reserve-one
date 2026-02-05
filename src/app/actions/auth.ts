"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthState = { error?: string } | null;

export async function login(prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function register(prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        app_name: "reserve-one",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Service Role でプロファイル作成（トリガーなし運用）
  const user = data?.user;
  if (user) {
    const admin = createAdminClient();
    if (!admin) {
      return {
        error:
          "サーバー設定が必要です。.env.local に SUPABASE_SERVICE_ROLE_KEY を設定してください。（Supabase ダッシュボード > Settings > API）",
      };
    }
    const role = ["admin@example.com"].includes((user.email ?? email).toLowerCase())
      ? "admin"
      : "customer";
    const { error: profileError } = await admin.from("reserve_profiles").upsert(
      { id: user.id, email: user.email ?? email, role },
      { onConflict: "id" }
    );
    if (profileError) {
      return { error: `プロファイル作成に失敗しました: ${profileError.message}` };
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
