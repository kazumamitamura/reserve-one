import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, LogIn, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reserve-One</h1>
            <p className="text-slate-600 mt-1">B2B予約管理システム</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-md hover:bg-blue-700 transition"
            >
              <LogIn className="w-4 h-4" />
              ログイン
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <UserPlus className="w-4 h-4" />
              新規登録
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("reserve_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as "admin" | "customer") || "customer";
  if (role === "admin") redirect("/admin");
  redirect("/dashboard");
}
