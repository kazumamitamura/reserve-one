"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SlotCreateState = { error?: string; success?: boolean } | null;

export async function createSlots(
  prev: SlotCreateState,
  formData: FormData
): Promise<SlotCreateState> {
  const supabase = await createClient();
  const date = formData.get("date") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const timesInput = formData.get("times") as string | null;

  if (!date) {
    return { error: "日付を入力してください。" };
  }

  const slots: { start_time: string; end_time: string }[] = [];
  const [y, mo, d] = date.split("-").map(Number);

  if (timesInput && timesInput.trim()) {
    const times = timesInput.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean);
    const invalidTimes = times.filter((t) => !/^\d{1,2}:\d{2}$/.test(t));
    if (invalidTimes.length > 0) {
      return { error: `時刻の形式が正しくありません: ${invalidTimes.join(", ")}` };
    }
    const durationMinutes = 30;
    for (const timeStr of times) {
      const [h, m] = timeStr.split(":").map(Number);
      const start = new Date(y, mo - 1, d, h, m ?? 0, 0, 0);
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      slots.push({ start_time: start.toISOString(), end_time: end.toISOString() });
    }
  } else if (startTime && endTime) {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const start = new Date(y, mo - 1, d, sh, sm ?? 0, 0, 0);
    const end = new Date(y, mo - 1, d, eh, em ?? 0, 0, 0);
    if (start >= end) return { error: "終了時刻は開始時刻より後にしてください。" };
    slots.push({ start_time: start.toISOString(), end_time: end.toISOString() });
  } else {
    return { error: "開始・終了時刻、または時刻一覧（例: 9:00, 10:00）を入力してください。" };
  }

  const { error } = await supabase.from("reserve_slots").insert(slots);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export type BookSlotResult = { ok: true } | { ok: false; error: string };

export async function bookSlotAction(
  _prev: BookSlotResult | null,
  formData: FormData
): Promise<BookSlotResult> {
  const slotId = formData.get("slotId") as string;
  if (!slotId) return { ok: false, error: "枠が指定されていません。" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインしてください。" };

  const { error } = await supabase
    .from("reserve_slots")
    .update({ is_booked: true, booked_by: user.id })
    .eq("id", slotId)
    .eq("is_booked", false);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { ok: true };
}

export async function cancelBooking(slotId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reserve_slots")
    .update({ is_booked: false, booked_by: null })
    .eq("id", slotId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function cancelBookingAction(_prev: null, formData: FormData) {
  const slotId = formData.get("slotId") as string;
  if (!slotId) return;
  await cancelBooking(slotId);
}

/** フォーム action 用（FormData のみ受け取る） */
export async function cancelBookingFormAction(formData: FormData) {
  const slotId = formData.get("slotId") as string;
  if (!slotId) return;
  await cancelBooking(slotId);
}
