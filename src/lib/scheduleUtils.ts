/**
 * 30分刻みのスケジュール用ユーティリティ
 */

const START_HOUR = 8;
const END_HOUR = 18;

/** 1日の30分刻みの時間ラベル（8:00 ～ 17:30） */
export function getThirtyMinuteSlots(): string[] {
  const slots: string[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

/** 日付文字列(YYYY-MM-DD) + 時間(HH:mm) から ISO の start/end を生成 */
export function slotToISO(dateStr: string, timeStr: string): { start: string; end: string } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const start = new Date(dateStr);
  start.setHours(hours, minutes ?? 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** スロットの start_time から "HH:mm" を取得 */
export function slotStartToTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
