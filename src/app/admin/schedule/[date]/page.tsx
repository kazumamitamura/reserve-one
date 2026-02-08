"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
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

export default function AdminSchedulePage({
  params,
}: {
  params: { date: string };
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [slotsForDay, setSlotsForDay] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedDate = params.date;

  async function checkAdmin() {
    const supabase = createClient();
    setAdminError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAdminError("ログインされていません");
      setIsAdmin(false);
      return;
    }
    const { data: profile, error } = await supabase
      .from("reserve_profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (error || !profile) {
      setAdminError(`プロフィール取得エラー: ${error?.message ?? "不明なエラー"}`);
      setIsAdmin(false);
      return;
    }
    setIsAdmin(profile.role === "admin");
  }

  const fetchSlotsForDay = useCallback(async () => {
    const supabase = createClient();
    const start = new Date(`${selectedDate}T00:00:00`);
    const end = new Date(`${selectedDate}T23:59:59`);

    const { data, error } = await supabase
      .from("reserve_slots")
      .select(`*, reserve_profiles:booked_by (email)`)
      .gte("start_time", start.toISOString())
      .lte("start_time", end.toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Fetch slots error:", error);
      setSlotsForDay([]);
      setLoading(false);
      return;
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
    setSlotsForDay(slots);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSlotsForDay();
  }, [fetchSlotsForDay]);

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
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => checkAdmin()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            再確認
          </button>
          <Link
            href="/admin"
            className="inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            月間カレンダーに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">当日スケジュール</h1>
          <p className="mt-1 text-sm text-slate-600">
            {format(new Date(selectedDate + "T12:00:00"), "yyyy/MM/dd")} の予約可能時間を設定します
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          月間カレンダーへ戻る
        </button>
      </div>

      <FullDaySchedule
        mode="admin"
        selectedDate={selectedDate}
        slotsForDay={slotsForDay}
        onSlotsChange={fetchSlotsForDay}
      />

      {loading && (
        <p className="text-center text-sm text-slate-500">読み込み中...</p>
      )}
    </div>
  );
}
