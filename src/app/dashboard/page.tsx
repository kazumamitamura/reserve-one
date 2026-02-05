"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, Clock } from "lucide-react";
import { BookingCalendar } from "@/components/dashboard/BookingCalendar";
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

  return (
    <div className="space-y-8">
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
        <h1 className="text-xl font-bold text-slate-800">予約カレンダー</h1>
        <p className="mt-1 text-sm text-slate-600">
          利用可能な枠から予約できます
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
        <h2 className="mb-3 text-base font-semibold text-slate-700">マイ予約</h2>
        {myBookings.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-4 py-4 text-sm text-slate-500">
            予約はありません
          </p>
        ) : (
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
        )}
      </section>

      <BookingCalendar
        slots={slots}
        userId={user.id}
        onBookClick={handleBookClick}
        isBooking={!!bookingId}
        bookingSlotId={bookingId}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
        <h2 className="mb-4 text-base font-semibold text-slate-700">
          利用可能な枠（リスト表示）
        </h2>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {slots.length === 0 ? (
          <div className="rounded-lg bg-slate-50 px-4 py-8 text-center">
            <p className="text-slate-500 mb-2">現在、利用可能な枠はありません</p>
            <p className="text-sm text-slate-500">
              管理者が枠を作成するとここに表示されます。
              <br />
              管理者の方は <a href="/admin" className="text-blue-600 hover:underline">管理画面</a> から枠を作成してください。
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => {
              const isBooked = slot.is_booked;
              const isMine = slot.booked_by === user.id;

              return (
                <div
                  key={slot.id}
                  className={`rounded-xl border p-4 shadow-md transition ${
                    isBooked
                      ? "border-slate-200 bg-slate-50 opacity-80"
                      : "border-slate-200 bg-white shadow-slate-200/50 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {format(new Date(slot.start_time), "M/d(E)", { locale: ja })}
                        </span>
                      </div>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {format(new Date(slot.start_time), "HH:mm")}
                        {" ～ "}
                        {format(new Date(slot.end_time), "HH:mm")}
                      </p>
                      {isBooked ? (
                        <p className="mt-2 text-sm font-medium text-slate-500">
                          {isMine ? "予約済み（あなた）" : "受付終了"}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBookClick(slot)}
                          disabled={!!bookingId}
                          className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
                        >
                          {bookingId === slot.id ? "予約中..." : "予約する"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
