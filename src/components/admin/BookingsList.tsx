import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { ReserveSlotWithBooker } from "@/lib/types";

export function BookingsList({ slots }: { slots: ReserveSlotWithBooker[] }) {
  if (slots.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        予約はありません
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              日時
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              予約者
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {slots.map((slot) => (
            <tr key={slot.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                {format(new Date(slot.start_time), "M/d(E) HH:mm", { locale: ja })}
                {" ～ "}
                {format(new Date(slot.end_time), "HH:mm", { locale: ja })}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {slot.booker_email ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
