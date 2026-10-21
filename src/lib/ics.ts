import { nextSchoolDay, schoolDayIndex, isSchoolDay } from "./schedule-days";
import { sortByTime, toMin, type Timetable } from "./timetable";

const pad = (n: number) => String(n).padStart(2, "0");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

export function buildIcs(tt: Timetable, reminderText: string, from = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Orar//Timetable//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Bucharest",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0300",
    "TZNAME:EEST",
    "DTSTART:19700329T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0300",
    "TZOFFSETTO:+0200",
    "TZNAME:EET",
    "DTSTART:19701025T040000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];
  const stamp = `${from.getUTCFullYear()}${pad(from.getUTCMonth() + 1)}${pad(from.getUTCDate())}T000000Z`;
  tt.days.forEach((day, di) => {
    let d = new Date(from);
    if (!isSchoolDay(d)) d = nextSchoolDay(d);
    while (schoolDayIndex(d) !== di) d = nextSchoolDay(d);
    const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    sortByTime(day).forEach((l, i) => {
      const s = toMin(l.time);
      const e = s + tt.lessonLen;
      const fmt = (m: number) => `${pad(Math.floor(m / 60))}${pad(m % 60)}00`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:orar-${di}-${i}-${l.id}@orar`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=Europe/Bucharest:${date}T${fmt(s)}`,
        `DTEND;TZID=Europe/Bucharest:${date}T${fmt(e)}`,
        "RRULE:FREQ=WEEKLY",
        `SUMMARY:${esc(l.subject)}`,
        ...(tt.className ? [`DESCRIPTION:${esc([tt.school, tt.className].filter(Boolean).join(" · "))}`] : []),
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${esc(`${l.subject} ${reminderText}`)}`,
        "TRIGGER:-PT5M",
        "END:VALARM",
        "END:VEVENT",
      );
    });
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
