"use client";

type CalendarEventInput = {
  title: string;
  start: Date;
  end: Date;
  details?: string;
  location?: string;
};

function formatUtcForCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildGoogleCalendarUrl(input: CalendarEventInput): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${formatUtcForCalendar(input.start)}/${formatUtcForCalendar(input.end)}`,
    details: input.details ?? "",
    location: input.location ?? "",
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(input: CalendarEventInput & { uid?: string }): string {
  const uid = input.uid ?? `${Date.now()}@reserve-one`;
  const dtstamp = formatUtcForCalendar(new Date());
  const dtstart = formatUtcForCalendar(input.start);
  const dtend = formatUtcForCalendar(input.end);
  const description = (input.details ?? "").replace(/\n/g, "\\n");
  const location = input.location ?? "";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Reserve-One//Booking//JP",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${input.title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
