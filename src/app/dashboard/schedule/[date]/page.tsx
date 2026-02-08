"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { FullDaySchedule } from "@/components/shared/FullDaySchedule";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { bookSlotAction } from "@/app/actions/slots";
import { useActionState } from "react";
import { CalendarPlus, Download } from "lucide-react";
import { buildGoogleCalendarUrl, buildIcsContent, downloadIcsFile } from "@/utils/calendar";

type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  booked_by: string | null;
};

export default function DashboardSchedulePage({
  params,
}: {
  params: { date: string };
}) {
  const router = useRouter();
  const selectedDate = params.date;
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [slotsForDay, setSlotsForDay] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingSlot, setPendingSlot] = useState<Slot | null>(null);
  const [lastBookedSlot, setLastBookedSlot] = useState<Slot | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [state, formAction] = useActionState(bookSlotAction, null);

  const fetchSlotsForDay = useCallback(async (userId?: string) => {
    const supabase = createClient();
    const start = new Date(`${selectedDate}T00:00:00`);
    const end = new Date(`${selectedDate}T23:59:59`);

    const { data } = await supabase
      .from("reserve_slots")
      .select("id, start_time, end_time, is_booked")
      .gte("start_time", start.toISOString())
      .lte("start_time", end.toISOString())
      .order("start_time", { ascending: true });

    const effectiveUserId = userId ?? user?.id;
    if (!effectiveUserId) {
      setSlotsForDay((data ?? []) as Slot[]);
      setLoading(false);
      return;
    }

    const { data: mySlots } = await supabase
      .from("reserve_slots")
      .select("id")
      .eq("booked_by", effectiveUserId)
      .gte("start_time", start.toISOString())
      .lte("start_time", end.toISOString());

    const myIds = new Set((mySlots ?? []).map((s) => s.id));
    const merged = (data ?? []).map((s) => ({
      ...s,
      booked_by: myIds.has(s.id) ? effectiveUserId : null,
    }));

    setSlotsForDay(merged);
    setLoading(false);
  }, [selectedDate, user]);

  useEffect(() => {
    const supabase = createClient();
    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      await fetchSlotsForDay(u.id);
    }
    init();
  }, [router, fetchSlotsForDay]);

  useEffect(() => {
    if (state?.ok) {
      fetchSlotsForDay();
    }
  }, [state, fetchSlotsForDay]);

  function handleRequestBook(slot: Slot) {
    if (!user || slot.is_booked) return;
    setPendingSlot(slot);
  }

  function handleConfirm() {
    if (!pendingSlot || !formRef.current) return;
    setLastBookedSlot(pendingSlot);
    formRef.current.requestSubmit();
    setPendingSlot(null);
  }

  function handleCancel() {
    setPendingSlot(null);
  }

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <p className="text-slate-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={!!pendingSlot}
        title="予約の確認"
        message={
          pendingSlot
            ? `この枠で予約しますか？\n${format(new Date(pendingSlot.start_time), "M/d(E) HH:mm", { locale: ja })} ～ ${format(new Date(pendingSlot.end_time), "HH:mm", { locale: ja })}`
            : ""
        }
        confirmLabel="予約する"
        cancelLabel="キャンセル"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={false}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">当日スケジュール</h1>
          <p className="mt-1 text-sm text-slate-600">
            {format(new Date(selectedDate + "T12:00:00"), "yyyy/MM/dd")} の予約
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          月間カレンダーへ戻る
        </button>
      </div>

      {state?.ok === false && state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.ok && lastBookedSlot && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-700">
          <p className="font-medium">予約が完了しました。</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={buildGoogleCalendarUrl({
                title: "面談予約",
                start: new Date(lastBookedSlot.start_time),
                end: new Date(lastBookedSlot.end_time),
                details: `予約ID: ${lastBookedSlot.id}`,
                location: "オンライン",
              })}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <CalendarPlus className="h-4 w-4" />
              Googleカレンダーに追加
            </a>
            <button
              type="button"
              onClick={() => {
                const content = buildIcsContent({
                  title: "面談予約",
                  start: new Date(lastBookedSlot.start_time),
                  end: new Date(lastBookedSlot.end_time),
                  details: `予約ID: ${lastBookedSlot.id}`,
                  location: "オンライン",
                  uid: lastBookedSlot.id,
                });
                downloadIcsFile(`booking-${lastBookedSlot.id}.ics`, content);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              その他のカレンダー (.ics)
            </button>
          </div>
        </div>
      )}

      <form ref={formRef} action={formAction}>
        <input type="hidden" name="slotId" value={pendingSlot?.id ?? ""} />
      </form>

      <FullDaySchedule
        mode="customer"
        selectedDate={selectedDate}
        slotsForDay={slotsForDay}
        userId={user.id}
        onBookClick={handleRequestBook}
        isBooking={false}
        bookingSlotId={null}
      />
    </div>
  );
}
