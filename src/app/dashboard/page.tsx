"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FullScreenMonthCalendar } from "@/components/shared/FullScreenMonthCalendar";

type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
};


export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const fetchSlots = useCallback(async () => {
    const supabase = createClient();
    const now = new Date();
    const futureEnd = new Date(now);
    futureEnd.setDate(futureEnd.getDate() + 60);

    const { data } = await supabase
      .from("reserve_slots")
      .select("id, start_time, end_time, is_booked")
      .gte("start_time", now.toISOString())
      .lte("start_time", futureEnd.toISOString())
      .order("start_time", { ascending: true });

    return data ?? [];
  }, []);

  useEffect(() => {
    const supabase = createClient();
    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      const data = await fetchSlots();
      setSlots(data);
      setLoading(false);
    }
    init();
  }, [router, fetchSlots]);

  if (loading || !user) {
    return (
      <div className="space-y-8">
        <p className="text-slate-500">読み込み中...</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">予約</h1>
        <p className="mt-1 text-sm text-slate-600">
          月間カレンダーから日付を選び、30分刻みのスケジュールから予約できます
        </p>
      </div>

      <section className="w-full">
        <FullScreenMonthCalendar
          currentDate={calendarDate}
          onCurrentDateChange={setCalendarDate}
          onDateSelect={(dateKey) => router.push(`/dashboard/schedule/${dateKey}`)}
          slots={slots}
          highlightMode="any"
        />
      </section>
    </div>
  );
}
