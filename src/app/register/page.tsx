import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { register } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/AuthForm";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-slate-700 hover:text-slate-900"
        >
          <Calendar className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-semibold">Reserve-One</span>
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/50">
          <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            新規登録
          </h1>
          <AuthForm action={register} type="register" />
          <p className="mt-4 text-center text-sm text-slate-500">
            すでにアカウントをお持ちの方は{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
