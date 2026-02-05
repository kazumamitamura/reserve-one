import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cancelBookingFormAction } from "@/app/actions/slots";
import type { ReserveSlot } from "@/lib/types";

export async function MyBookingsSection({
  upcoming,
  userId,
}: {
  upcoming: ReserveSlot[];
  userId: string;
}) {
  const myBookings = upcoming.filter((s) => s.is_booked && s.booked_by === userId);

  if (myBookings.length === 0) {
    return (
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-700">マイ予約</h2>
        <p className="rounded-lg bg-slate-50 px-4 py-4 text-sm text-slate-500">
          予約はありません
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-slate-700">マイ予約</h2>
      <div className="space-y-2">
        {myBookings.map((slot) => (
          <div
            key={slot.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <span className="font-medium text-slate-900">
                {format(new Date(slot.start_time), "M/d(E) HH:mm", { locale: ja })}
                {" ～ "}
                {format(new Date(slot.end_time), "HH:mm", { locale: ja })}
              </span>
            </div>
            <form action={cancelBookingFormAction}>
              <input type="hidden" name="slotId" value={slot.id} />
              <button
                type="submit"
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                キャンセル
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
