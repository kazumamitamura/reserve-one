"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { getThirtyMinuteSlots, slotStartToTime } from "@/lib/scheduleUtils";

type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  booked_by: string | null;
};

type Props = {
  selectedDate: string;
  slotsForDay: Slot[];
  userId: string;
  onBookClick: (slot: Slot) => void;
  isBooking: boolean;
  bookingSlotId: string | null;
};

function getEndTime(timeStr: string): string {
  if (timeStr === "17:30") return "18:00";
  const [h, m] = timeStr.split(":").map(Number);
  if (m === 30) return `${(h + 1).toString().padStart(2, "0")}:00`;
  return `${h.toString().padStart(2, "0")}:30`;
}

export function DayScheduleGrid({
  selectedDate,
  slotsForDay,
  userId,
  onBookClick,
  isBooking,
  bookingSlotId,
}: Props) {
  const timeSlots = getThirtyMinuteSlots();
  const slotMap = new Map<string, Slot>();
  slotsForDay.forEach((s) => {
    const key = slotStartToTime(s.start_time);
    slotMap.set(key, s);
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
      <h2 className="text-base font-semibold text-slate-800">
        {format(new Date(selectedDate + "T12:00:00"), "M月d日(E)", { locale: ja })} の予約
      </h2>
      <p className="mt-1 mb-4 text-sm text-slate-600">
        30分刻みのスケジュール。予約可能な枠から選択してください。
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                時間
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                状態
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {timeSlots.map((timeStr) => {
              const slot = slotMap.get(timeStr);
              const endTime = getEndTime(timeStr);

              if (!slot) {
                return (
                  <tr key={timeStr} className="bg-slate-100">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-400">
                      {timeStr} ～ {endTime}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        受付不可
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">—</td>
                  </tr>
                );
              }

              const isMine = slot.booked_by === userId;
              if (slot.is_booked) {
                return (
                  <tr key={slot.id} className="bg-blue-50/50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                      {timeStr} ～ {endTime}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {isMine ? "予約済み（あなた）" : "受付終了"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">—</td>
                  </tr>
                );
              }

              return (
                <tr key={slot.id} className="bg-green-50/50 hover:bg-green-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                    {timeStr} ～ {endTime}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      予約可
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isBooking}
                      onClick={() => onBookClick(slot)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isBooking && bookingSlotId === slot.id ? "予約中..." : "予約する"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-4 w-4 rounded bg-slate-200" /> 受付不可
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-4 w-4 rounded bg-green-100" /> 予約可
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-4 w-4 rounded bg-blue-100" /> 予約済み
        </span>
      </div>
    </div>
  );
}
