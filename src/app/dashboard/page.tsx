"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { MonthCalendarSelect } from "@/components/shared/MonthCalendarSelect";
import { FullDaySchedule } from "@/components/shared/FullDaySchedule";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  booked_by: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmSlot, setConfirmSlot] = useState<Slot | null>(null);

  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    const supabase = createClient();
    const now = new Date();
    const futureEnd = new Date(now);
    futureEnd.setDate(futureEnd.getDate() + 60);

    const { data } = await supabase
      .from("reserve_slots")
      .select("id, start_time, end_time, is_booked, booked_by")
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

  function handleBookClick(slot: Slot) {
    if (!user || slot.is_booked) return;
    setConfirmSlot(slot);
    setError(null);
  }

  async function handleBookConfirm() {
    if (!user || !confirmSlot) return;
    setBookingId(confirmSlot.id);
    const supabase = createClient();

    const { error: err } = await supabase
      .from("reserve_slots")
      .update({ is_booked: true, booked_by: user.id })
      .eq("id", confirmSlot.id)
      .eq("is_booked", false);

    setBookingId(null);
    setConfirmSlot(null);

    if (err) {
      setError(err.message);
      return;
    }
    const refreshed = await fetchSlots();
    setSlots(refreshed);
    alert("予約が完了しました");
  }

  function handleBookCancel() {
    setConfirmSlot(null);
  }

  async function handleCancel(slotId: string) {
    setError(null);
    const supabase = createClient();

    const { error: err } = await supabase
      .from("reserve_slots")
      .update({ is_booked: false, booked_by: null })
      .eq("id", slotId);

    if (err) {
      setError(err.message);
      return;
    }
    const refreshed = await fetchSlots();
    setSlots(refreshed);
    alert("キャンセルしました");
  }

  if (loading || !user) {
    return (
      <div className="space-y-8">
        <p className="text-slate-500">読み込み中...</p>
      </div>
    );
  }

  const myBookings = slots.filter((s) => s.is_booked && s.booked_by === user.id);
  const slotsForDay = selectedDate
    ? slots.filter((s) => format(new Date(s.start_time), "yyyy-MM-dd") === selectedDate)
    : [];

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={!!confirmSlot}
        title="予約の確認"
        message={
          confirmSlot
            ? `この枠で予約しますか？\n${format(new Date(confirmSlot.start_time), "M/d(E) HH:mm", { locale: ja })} ～ ${format(new Date(confirmSlot.end_time), "HH:mm", { locale: ja })}`
            : ""
        }
        confirmLabel="予約する"
        cancelLabel="キャンセル"
        onConfirm={handleBookConfirm}
        onCancel={handleBookCancel}
        isLoading={!!bookingId}
      />

      <div>
        <h1 className="text-xl font-bold text-slate-800">予約</h1>
        <p className="mt-1 text-sm text-slate-600">
          月間カレンダーから日付を選び、30分刻みのスケジュールから予約できます
        </p>
      </div>

      {/* マイ予約 */}
      {myBookings.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">マイ予約</h2>
          <div className="space-y-2">
            {myBookings.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <span className="font-medium text-slate-900">
                  {format(new Date(slot.start_time), "M/d(E) HH:mm", { locale: ja })}
                  {" ～ "}
                  {format(new Date(slot.end_time), "HH:mm", { locale: ja })}
                </span>
                <button
                  type="button"
                  onClick={() => handleCancel(slot.id)}
                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  キャンセル
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="max-w-md">
        <h2 className="mb-2 text-sm font-medium text-slate-700">月間カレンダー</h2>
        <MonthCalendarSelect
          currentDate={calendarDate}
          onCurrentDateChange={setCalendarDate}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          slots={slots}
          highlightMode="any"
        />
      </section>

      {selectedDate ? (
        <section className="w-full">
          <FullDaySchedule
            mode="customer"
            selectedDate={selectedDate}
            slotsForDay={slotsForDay}
            userId={user.id}
            onBookClick={handleBookClick}
            isBooking={!!bookingId}
            bookingSlotId={bookingId}
          />
        </section>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500">日付を選択すると、その日の30分刻みスケジュールが表示されます。</p>
          <p className="mt-1 text-sm text-slate-400">対応可能な枠から「予約する」で予約できます。</p>
        </div>
      )}
    </div>
  );
}
