"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { MonthCalendarSelect } from "@/components/shared/MonthCalendarSelect";
import { FullDaySchedule } from "@/components/shared/FullDaySchedule";

type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  booker_email: string | null;
};

type SlotRow = {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  reserve_profiles: { email?: string } | { email?: string }[] | null;
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  const [adminError, setAdminError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);

  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  const refetchSlots = useCallback(async () => {
    const supabase = createClient();
    const now = new Date();
    const past = new Date(now);
    past.setDate(past.getDate() - 7);
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 90);

    const { data, error } = await supabase
      .from("reserve_slots")
      .select(`*, reserve_profiles:booked_by (email)`)
      .gte("start_time", past.toISOString())
      .lte("start_time", limit.toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Fetch slots error:", error);
    }

    const slots: Slot[] = ((data ?? []) as SlotRow[]).map((s) => {
      const p = s.reserve_profiles;
      const email = Array.isArray(p) ? p[0]?.email : (p as { email?: string } | null)?.email;
      return {
        id: s.id,
        start_time: s.start_time,
        end_time: s.end_time,
        is_booked: s.is_booked ?? false,
        booker_email: email ?? null,
      };
    });
    setAllSlots(slots);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    refetchSlots();
  }, [refetchSlots]);

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

  const slotsForDay = selectedDate
    ? allSlots.filter((s) => format(new Date(s.start_time), "yyyy-MM-dd") === selectedDate)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">管理ダッシュボード</h1>
        <p className="mt-1 text-sm text-slate-600">
          月間カレンダーから日付を選び、その日の予約可能時間を登録・確認できます
        </p>
      </div>

      <section className="max-w-md">
        <h2 className="mb-2 text-sm font-medium text-slate-700">月間カレンダー</h2>
        <MonthCalendarSelect
          currentDate={calendarDate}
          onCurrentDateChange={setCalendarDate}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          slots={allSlots}
          highlightMode="any"
        />
      </section>

      {selectedDate ? (
        <section className="w-full">
          <FullDaySchedule
            mode="admin"
            selectedDate={selectedDate}
            slotsForDay={slotsForDay}
            onSlotsChange={refetchSlots}
          />
        </section>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500">日付を選択すると、その日の30分刻みスケジュールが表示されます。</p>
          <p className="mt-1 text-sm text-slate-400">対応不可の枠を「予約可能に登録」で予約可能にできます。</p>
        </div>
      )}

      {loading && (
        <p className="text-center text-sm text-slate-500">読み込み中...</p>
      )}
    </div>
  );
}
