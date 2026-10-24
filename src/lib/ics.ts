import { dateKey, parseDate, schoolDayIndex, isSchoolDay, defaultCalendarSettings, type CalendarSettings } from "./schedule-days";
import { ACTIVE_CALENDAR } from "./calendar-2026-2027";
import { sortByTime, toMin, type Timetable } from "./timetable";

const pad = (n: number) => String(n).padStart(2, "0");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

export function buildIcs(tt: Timetable, reminderText: string, from = new Date(), settings: CalendarSettings = defaultCalendarSettings()): string {
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
  const last = ACTIVE_CALENDAR.lastDayByGrade[settings.grade];
  const compact = (date: Date) => dateKey(date).replace(/-/g, "");
  tt.days.forEach((day, di) => {
    const d = parseDate(dateKey(from) < ACTIVE_CALENDAR.firstDay ? ACTIVE_CALENDAR.firstDay : dateKey(from));
    while (dateKey(d) <= last && schoolDayIndex(d) !== di) d.setDate(d.getDate() + 1);
    if (dateKey(d) > last) return;
    const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    sortByTime(day).forEach((l, i) => {
      const s = toMin(l.time);
      const e = s + tt.lessonLen;
      const fmt = (m: number) => `${pad(Math.floor((m % 1440) / 60))}${pad(m % 60)}00`;
      const endDay = new Date(d);
      endDay.setDate(endDay.getDate() + Math.floor(e / 1440));
      const endDate = `${endDay.getFullYear()}${pad(endDay.getMonth() + 1)}${pad(endDay.getDate())}`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:orar-${di}-${i}-${l.id}@orar`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=Europe/Bucharest:${date}T${fmt(s)}`,
        `DTEND;TZID=Europe/Bucharest:${endDate}T${fmt(e)}`,
        `RRULE:FREQ=WEEKLY;UNTIL=${last.replace(/-/g, "")}T205959Z`,
        ...(() => {
          const exceptions: string[] = []; const cursor = new Date(d);
          while (dateKey(cursor) <= last) {
            if (!isSchoolDay(cursor, settings)) exceptions.push(`EXDATE;TZID=Europe/Bucharest:${compact(cursor)}T${fmt(s)}`);
            cursor.setDate(cursor.getDate() + 7);
          }
          return exceptions;
        })(),
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
  const L = (ro: string, en: string) => settings.lang === "ro" ? ro : en;
  const allDay = (id: string, label: string, start: string, end = start, tentative = false) => {
    const after = parseDate(end); after.setDate(after.getDate() + 1);
    lines.push("BEGIN:VEVENT", `UID:orar-calendar-${id}@orar`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${start.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${compact(after)}`, `SUMMARY:${esc(label)}`, "TRANSP:TRANSPARENT", ...(tentative ? ["STATUS:TENTATIVE", `DESCRIPTION:${esc(L("O singură săptămână este liberă. Alege-o în Setări.", "Only one of these weeks is free. Choose it in Settings."))}`] : []), "END:VEVENT");
  };
  for (const v of ACTIVE_CALENDAR.vacations) allDay(v.id, L(v.ro, v.en), v.from, v.to);
  for (const h of [...ACTIVE_CALENDAR.legalHolidays, ...ACTIVE_CALENDAR.extraDaysOff]) allDay(h.date, L(h.ro, h.en), h.date);
  ACTIVE_CALENDAR.isjWeekOptions.forEach((w, i) => {
    if (settings.countyWeek === "unknown" || (settings.countyWeek === "A" ? 0 : 1) === i) allDay(`county-${i}`, L("Vacanță ISJ/ISMB", "County (ISJ/ISMB) break"), w.from, w.to, settings.countyWeek === "unknown");
  });
  for (const w of settings.specialWeeks) allDay(w.id, w.label, w.from, w.to);
  for (const d of settings.daysOff) allDay(d.id, d.label, d.date);
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
