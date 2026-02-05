"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { SlotCalendar } from "@/components/admin/SlotCalendar";

type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  booker_email: string | null;
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:30");
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [adminError, setAdminError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);
  const [insertError, setInsertError] = useState<string | null>(null);

  async function checkAdmin() {
    const supabase = createClient();
    setAdminError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAdminError("ログインされていません");
      setIsAdmin(false);
      return;
    }
    setCurrentUser({ id: user.id, email: user.email });
    const { data: profile, error } = await supabase
      .from("reserve_profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (error) {
      setAdminError(`プロフィール取得エラー: ${error.message}`);
      setIsAdmin(false);
      return;
    }
    if (!profile) {
      setAdminError("reserve_profiles にあなたのレコードがありません。Supabase の auth.users の id と同じ id で reserve_profiles に行を追加してください。");
      setIsAdmin(false);
      return;
    }
    setIsAdmin(profile.role === "admin");
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    async function fetchSlots() {
      const now = new Date();
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      const limit = new Date(now);
      limit.setDate(limit.getDate() + 90);

      const { data, error } = await supabase
        .from("reserve_slots")
        .select(`
          id,
          start_time,
          end_time,
          is_booked,
          reserve_profiles:booked_by (email)
        `)
        .gte("start_time", past.toISOString())
        .lte("start_time", limit.toISOString())
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Fetch slots error:", error);
      }

      const slots = (data ?? []).map((s: { is_booked: boolean; reserve_profiles: { email?: string } | { email?: string }[] | null }) => {
        const p = s.reserve_profiles;
        const email = Array.isArray(p) ? p[0]?.email : (p as { email?: string } | null)?.email;
        return { ...s, booker_email: email ?? null };
      });
      setAllSlots(slots);
      setLoading(false);
    }
    setLoading(true);
    fetchSlots();
  }, []);

  if (isAdmin === null) {
    return <p className="text-slate-500">読み込み中...</p>;
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-amber-800">管理者権限が必要です</h2>
        {adminError && (
          <p className="mt-2 text-sm text-red-700 font-medium">{adminError}</p>
        )}
        {currentUser && (
          <div className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-600">
            <p>ログイン中: <strong>{currentUser.email ?? "—"}</strong></p>
            <p className="mt-1 break-all">ID: <code>{currentUser.id}</code></p>
            <p className="mt-2 text-slate-500">Supabase の reserve_profiles の id がこの ID と一致し、role が admin か確認してください。</p>
          </div>
        )}
        <p className="mt-3 text-sm text-amber-700">
          reserve_profiles で上記 ID の行の role を <code className="rounded bg-amber-100 px-1">admin</code> に設定後、「再確認」をクリックしてください。
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => checkAdmin()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            再確認
          </button>
          <Link
            href="/dashboard"
            className="inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInsertError(null);
    const supabase = createClient();
    
    // デバッグ: 認証状態を確認
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Current user:", user);
    
    if (!user) {
      setInsertError("認証エラー: ログインされていません。再ログインしてください。");
      return;
    }

    if (!date || !startTime || !endTime) {
      alert("日付・開始時間・終了時間を入力してください");
      return;
    }
    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);
    if (start >= end) {
      alert("終了時間は開始時間より後にしてください");
      return;
    }

    setSubmitting(true);
    console.log("Inserting slot:", { start_time: start.toISOString(), end_time: end.toISOString() });
    
    const { data, error } = await supabase.from("reserve_slots").insert([
      {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        is_booked: false,
      },
    ]).select();

    console.log("Insert result:", { data, error });
    setSubmitting(false);
    
    if (error) {
      const errorMsg = `エラー: ${error.message}\nCode: ${error.code}\nDetails: ${error.details || "N/A"}\nHint: ${error.hint || "N/A"}`;
      console.error("Insert error:", error);
      setInsertError(errorMsg);
      return;
    }
    alert("作成しました");
    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800">管理ダッシュボード</h1>
        <p className="mt-1 text-sm text-slate-600">
          枠を作成し、予約状況を確認できます
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
        <h2 className="text-base font-semibold text-slate-800">枠を作成する</h2>
        <p className="mt-1 text-sm text-slate-600">
          日付と開始・終了時間を指定して枠を作成します
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {insertError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 whitespace-pre-wrap">
              {insertError}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700">
                日付
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-slate-700">
                開始時間
              </label>
              <input
                id="start_time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-slate-700">
                終了時間
              </label>
              <input
                id="end_time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
          >
            {submitting ? "作成中..." : "枠を作成"}
          </button>
        </form>
      </section>

      <SlotCalendar slots={allSlots} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
        <h2 className="text-base font-semibold text-slate-800">作成した枠一覧</h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">
          全ての枠（空き枠・予約済み）
        </p>
        {loading ? (
          <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            読み込み中...
          </p>
        ) : allSlots.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            枠がありません。上のフォームから作成してください。
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    日時
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    ステータス
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    予約者
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {allSlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                      {format(new Date(slot.start_time), "M/d(E) HH:mm", { locale: ja })}
                      {" ～ "}
                      {format(new Date(slot.end_time), "HH:mm", { locale: ja })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {slot.is_booked ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          予約済み
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          空き
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {slot.booker_email ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
