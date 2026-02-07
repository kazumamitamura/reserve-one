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

type Slot = { start_time: string; is_booked?: boolean; booked_by?: string | null };

type Props = {
  currentDate: Date;
  onCurrentDateChange: (d: Date) => void;
  selectedDate: string | null;
  onDateSelect: (dateKey: string) => void;
  slots: Slot[];
  /** 日付にスロットがあるとクリック可能にする条件: "any"=スロットがあれば, "available"=空きがあれば */
  highlightMode?: "any" | "available";
};

export function MonthCalendarSelect({
  currentDate,
  onCurrentDateChange,
  selectedDate,
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

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  function isHighlighted(dateKey: string): boolean {
    const daySlots = slotsByDate.get(dateKey) || [];
    if (highlightMode === "any") return daySlots.length > 0;
    return daySlots.some((s) => !s.is_booked);
  }

  const now = new Date();
  const todayKey = format(now, "yyyy-MM-dd");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => onCurrentDateChange(subMonths(currentDate, 1))}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-semibold text-slate-800">
          {format(currentDate, "yyyy年M月", { locale: ja })}
        </h2>
        <button
          type="button"
          onClick={() => onCurrentDateChange(addMonths(currentDate, 1))}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={`bg-slate-50 py-1.5 text-center text-xs font-medium ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-600"
            }`}
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const hasSlots = isHighlighted(dateKey);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, now);
          const isSelected = selectedDate === dateKey;
          const dayOfWeek = day.getDay();
          const isPast = day < new Date(now.getFullYear(), now.getMonth(), now.getDate());

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => !isPast && onDateSelect(dateKey)}
              disabled={isPast}
              className={`min-h-[44px] p-1 text-left text-sm transition ${
                isCurrentMonth ? "bg-white" : "bg-slate-50"
              } ${!isCurrentMonth ? "opacity-50" : ""} ${
                isPast ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-blue-50"
              } ${isSelected ? "ring-2 ring-blue-500 ring-inset bg-blue-50" : ""} ${
                hasSlots && !isPast ? "font-medium" : ""
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                  isToday ? "bg-blue-600 text-white" : ""
                } ${
                  !isToday && dayOfWeek === 0 ? "text-red-500" : ""
                } ${!isToday && dayOfWeek === 6 ? "text-blue-500" : ""} ${
                  !isToday && dayOfWeek !== 0 && dayOfWeek !== 6 ? "text-slate-700" : ""
                }`}
              >
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500 text-center">
        日付をクリックするとその日のスケジュールを表示
      </p>
    </div>
  );
}
