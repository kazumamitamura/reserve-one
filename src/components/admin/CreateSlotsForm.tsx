"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createSlots, type SlotCreateState } from "@/app/actions/slots";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

export function CreateSlotsForm() {
  const [state, formAction] = useActionState(createSlots, null as SlotCreateState);
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [times, setTimes] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          枠を作成しました。
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700">
            <Calendar className="inline w-4 h-4 mr-1" />
            日付
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="times" className="block text-sm font-medium text-slate-700">
            <Clock className="inline w-4 h-4 mr-1" />
            時刻一覧（30分枠、例: 9:00, 10:00, 14:00）
          </label>
          <input
            id="times"
            name="times"
            type="text"
            placeholder="9:00, 10:00, 14:00"
            value={times}
            onChange={(e) => setTimes(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <p className="text-xs text-slate-500">または 1枠のみ作成:</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start_time" className="block text-sm font-medium text-slate-700">
            開始時刻
          </label>
          <input
            id="start_time"
            name="start_time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="end_time" className="block text-sm font-medium text-slate-700">
            終了時刻
          </label>
          <input
            id="end_time"
            name="end_time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
      >
        枠を作成
      </button>
    </form>
  );
}
