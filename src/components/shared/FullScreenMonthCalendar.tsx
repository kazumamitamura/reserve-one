"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slot = { start_time: string; is_booked?: boolean };

type Props = {
  currentDate: Date;
  onCurrentDateChange: (d: Date) => void;
  selectedDate?: string | null;
  onDateSelect: (dateKey: string) => void;
  slots: Slot[];
  highlightMode?: "any" | "available";
};

export function FullScreenMonthCalendar({
  currentDate,
  onCurrentDateChange,
  selectedDate = null,
  onDateSelect,
  slots,
  highlightMode = "any",
}: Props) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const slotsByDate = new Map<string, Slot[]>();
  slots.forEach((s) => {
    const key = format(new Date(s.start_time), "yyyy-MM-dd");
    if (!slotsByDate.has(key)) slotsByDate.set(key, []);
    slotsByDate.get(key)!.push(s);
  });

  function isHighlighted(dateKey: string): boolean {
    const daySlots = slotsByDate.get(dateKey) || [];
    if (highlightMode === "any") return daySlots.length > 0;
    return daySlots.some((s) => !s.is_booked);
  }

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
  const now = new Date();

  const rowCount = Math.ceil(days.length / 7);

  return (
    <div className="h-full w-full rounded-3xl border border-gray-300 bg-white shadow-lg overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300 bg-gray-100">
        <button
          type="button"
          onClick={() => onCurrentDateChange(subMonths(currentDate, 1))}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h2 className="text-2xl font-semibold text-slate-800">
          {format(currentDate, "yyyy年M月", { locale: ja })}
        </h2>
        <button
          type="button"
          onClick={() => onCurrentDateChange(addMonths(currentDate, 1))}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <ChevronRight className="w-6 h-6 text-slate-600" />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={`py-3 text-center text-sm font-medium border-b border-gray-300 bg-gray-100 ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-600"
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      <div
        className="grid grid-cols-7 flex-1"
        style={{ gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}
      >
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, now);
          const isSelected = selectedDate === dateKey;
          const isPast = day < new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const highlighted = isHighlighted(dateKey);
          const dayOfWeek = day.getDay();

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => !isPast && onDateSelect(dateKey)}
              disabled={isPast}
              className={`px-3 py-2 text-left border-b border-gray-300 border-r border-gray-300 transition ${
                isCurrentMonth ? "bg-white" : "bg-slate-50"
              } ${!isCurrentMonth ? "opacity-50" : ""} ${
                isPast ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-blue-50"
              } ${isSelected ? "ring-2 ring-blue-500 ring-inset bg-blue-50" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                    isToday ? "bg-blue-600 text-white" : ""
                  } ${
                    !isToday && dayOfWeek === 0 ? "text-red-500" : ""
                  } ${!isToday && dayOfWeek === 6 ? "text-blue-500" : ""} ${
                    !isToday && dayOfWeek !== 0 && dayOfWeek !== 6 ? "text-slate-700" : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
                {highlighted && !isPast && (
                  <span className="text-xs text-slate-500">予約枠あり</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
