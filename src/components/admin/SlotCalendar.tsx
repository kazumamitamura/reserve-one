"use client";

import { useState, useMemo } from "react";
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
  addWeeks,
  subWeeks,
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, CalendarDays } from "lucide-react";

type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
};

type ViewMode = "month" | "week";

export function SlotCalendar({ slots }: { slots: Slot[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const days = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, viewMode]);

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    slots.forEach((slot) => {
      const dateKey = format(new Date(slot.start_time), "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(slot);
    });
    return map;
  }, [slots]);

  function handlePrev() {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  }

  function handleNext() {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-lg font-semibold text-slate-800 min-w-[140px] text-center">
            {viewMode === "month"
              ? format(currentDate, "yyyy年M月", { locale: ja })
              : `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "M/d", { locale: ja })} ～ ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "M/d", { locale: ja })}`}
          </h2>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="ml-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            今日
          </button>
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${
              viewMode === "month"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Calendar className="w-4 h-4" />
            月
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${
              viewMode === "week"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            週
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={`bg-slate-50 py-2 text-center text-xs font-medium ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-600"
            }`}
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const daySlots = slotsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const dayOfWeek = day.getDay();

          const availableCount = daySlots.filter((s) => !s.is_booked).length;
          const bookedCount = daySlots.filter((s) => s.is_booked).length;

          return (
            <div
              key={dateKey}
              className={`min-h-[80px] p-1.5 ${
                viewMode === "week" ? "min-h-[120px]" : ""
              } ${
                isCurrentMonth || viewMode === "week"
                  ? "bg-white"
                  : "bg-slate-50"
              }`}
            >
              <div
                className={`text-xs font-medium mb-1 ${
                  isToday
                    ? "w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white mx-auto"
                    : dayOfWeek === 0
                    ? "text-red-500"
                    : dayOfWeek === 6
                    ? "text-blue-500"
                    : "text-slate-700"
                } ${!isCurrentMonth && viewMode === "month" ? "opacity-40" : ""}`}
              >
                {format(day, "d")}
              </div>
              {daySlots.length > 0 && (
                <div className="space-y-0.5">
                  {viewMode === "week" ? (
                    daySlots.slice(0, 5).map((slot) => (
                      <div
                        key={slot.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${
                          slot.is_booked
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {format(new Date(slot.start_time), "HH:mm")}
                        {slot.is_booked ? " 予約" : " 空"}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-wrap gap-0.5">
                      {availableCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-green-100 text-green-700 rounded">
                          {availableCount}
                        </span>
                      )}
                      {bookedCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {bookedCount}
                        </span>
                      )}
                    </div>
                  )}
                  {viewMode === "week" && daySlots.length > 5 && (
                    <div className="text-xs text-slate-500 px-1">
                      +{daySlots.length - 5}件
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 bg-green-100 rounded"></span>
          空き枠
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 bg-blue-100 rounded"></span>
          予約済み
        </div>
      </div>
    </div>
  );
}
