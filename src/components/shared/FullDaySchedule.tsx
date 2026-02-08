"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { getThirtyMinuteSlots, slotToISO, slotStartToTime } from "@/lib/scheduleUtils";

type SlotAdmin = {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  booker_email: string | null;
};

type SlotCustomer = {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  booked_by: string | null;
};

function getEndTime(timeStr: string): string {
  if (timeStr === "17:30") return "18:00";
  const [h, m] = timeStr.split(":").map(Number);
  if (m === 30) return `${(h + 1).toString().padStart(2, "0")}:00`;
  return `${h.toString().padStart(2, "0")}:30`;
}

type AdminProps = {
  mode: "admin";
  selectedDate: string;
  slotsForDay: SlotAdmin[];
  onSlotsChange: () => void;
};

type CustomerProps = {
  mode: "customer";
  selectedDate: string;
  slotsForDay: SlotCustomer[];
  userId: string;
  onBookClick: (slot: SlotCustomer) => void;
  isBooking: boolean;
  bookingSlotId: string | null;
};

type Props = AdminProps | CustomerProps;

export function FullDaySchedule(props: Props) {
  const [submitting, setSubmitting] = useState(false);
  const timeSlots = getThirtyMinuteSlots();

  const slotMap = new Map<string, AdminProps["slotsForDay"][0] | CustomerProps["slotsForDay"][0]>();
  props.slotsForDay.forEach((s) => {
    const key = slotStartToTime(s.start_time);
    slotMap.set(key, s);
  });

  async function handleRegister(timeStr: string) {
    if (props.mode !== "admin") return;
    setSubmitting(true);
    const supabase = createClient();
    const { start, end } = slotToISO(props.selectedDate, timeStr);
    const { error } = await supabase.from("reserve_slots").insert({
      start_time: start,
      end_time: end,
      is_booked: false,
    });
    setSubmitting(false);
    if (error) {
      alert(`登録に失敗しました: ${error.message}`);
      return;
    }
    props.onSlotsChange();
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800">
          {format(new Date(props.selectedDate + "T12:00:00"), "M月d日(E)", { locale: ja })} のスケジュール
        </h2>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
          {props.mode === "admin" ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-5 w-5 rounded bg-green-200" /> 予約可能
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-5 w-5 rounded bg-pink-200" /> 予約済み
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-5 w-5 rounded bg-slate-200" /> 予約不可
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-5 w-5 rounded bg-white border border-slate-300" /> 予約可能
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-5 w-5 rounded bg-pink-200" /> 予約済み
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-5 w-5 rounded bg-slate-200" /> 予約不可
              </span>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
        <table className="w-full min-w-[400px]">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">時間</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">状態</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeStr) => {
              const slot = slotMap.get(timeStr);
              const endTime = getEndTime(timeStr);

              if (!slot) {
                return (
                  <tr key={timeStr} className="border-b border-slate-100 bg-slate-100">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {timeStr} ～ {endTime}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">予約不可</span>
                    </td>
                    <td className="px-6 py-4">
                      {props.mode === "admin" ? (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleRegister(timeStr)}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          予約可能に登録
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              }

              if (props.mode === "admin") {
                const s = slot as SlotAdmin;
                const bgClass = s.is_booked ? "bg-pink-100" : "bg-green-100";
                return (
                  <tr key={s.id} className={`border-b border-slate-100 ${bgClass}`}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {timeStr} ～ {endTime}
                    </td>
                    <td className="px-6 py-4">
                      {s.is_booked ? (
                        <span className="text-sm text-pink-800 font-medium">
                          予約済み
                          {s.booker_email && (
                            <span className="ml-2 text-slate-600 font-normal">({s.booker_email})</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-green-800 font-medium">予約可能</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">—</td>
                  </tr>
                );
              }

              const s = slot as SlotCustomer;
              const isMine = s.booked_by === props.userId;
              const showAsBooked = s.is_booked && isMine;
              const bgClass = s.is_booked ? "bg-pink-100" : "bg-white";

              return (
                <tr key={s.id} className={`border-b border-slate-100 ${bgClass}`}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {timeStr} ～ {endTime}
                  </td>
                  <td className="px-6 py-4">
                    {showAsBooked ? (
                      <span className="text-sm text-pink-800 font-medium">予約済み（あなた）</span>
                    ) : s.is_booked ? (
                      <span className="text-sm text-slate-600">予約不可</span>
                    ) : (
                      <span className="text-sm text-slate-700">予約可能</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {!s.is_booked ? (
                      <button
                        type="button"
                        disabled={props.isBooking}
                        onClick={() => props.onBookClick(s)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {props.isBooking && props.bookingSlotId === s.id ? "予約中..." : "予約する"}
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
