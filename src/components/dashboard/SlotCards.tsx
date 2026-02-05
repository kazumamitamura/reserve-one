"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useActionState } from "react";
import { bookSlotAction } from "@/app/actions/slots";
import type { ReserveSlot } from "@/lib/types";
import { Calendar, Clock } from "lucide-react";

export function SlotCards({
  slots,
  userId,
}: {
  slots: ReserveSlot[];
  userId: string;
}) {
  const [state, formAction] = useActionState(bookSlotAction, null);

  const availableSlots = slots.filter((s) => !s.is_booked);
  const bookedSlots = slots.filter((s) => s.is_booked && s.booked_by === userId);

  return (
    <div className="space-y-6">
      {state?.ok === false && state.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          予約が完了しました。
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => {
          const isBooked = slot.is_booked;
          const isMine = slot.booked_by === userId;

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
                    <form action={formAction} className="mt-3">
                      <input type="hidden" name="slotId" value={slot.id} />
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                      >
                        予約する
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {slots.length === 0 && (
        <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-slate-500">
          現在、利用可能な枠はありません
        </p>
      )}
    </div>
  );
}
