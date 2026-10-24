import { ACTIVE_CALENDAR } from "./calendar-2026-2027";

/** Calendar policy lives here: every feature (lessons, homework, packing, reminders, exports) uses these rules. */
export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const parseDate = (key: string) => new Date(`${key}T12:00:00`);

export type GradeBand = "V-VII" | "VIII" | "XII-XIII";
export type CountyWeekChoice = "unknown" | "A" | "B";
export type SpecialWeek = { id: string; label: string; from: string; to: string; lessonsApply: boolean };
export type CustomDayOff = { id: string; date: string; label: string };
export type CalendarSettings = {
  grade: GradeBand;
  countyWeek: CountyWeekChoice;
  specialWeeks: SpecialWeek[];
  daysOff: CustomDayOff[];
  lang: "ro" | "en";
};
export const defaultCalendarSettings = (): CalendarSettings => ({ grade: "V-VII", countyWeek: "unknown", specialWeeks: [], daysOff: [], lang: "ro" });

export type DayStatusType = "before-year" | "summer" | "custom-off" | "holiday" | "vacation" | "county" | "special" | "weekend" | "school";
export type DayStatus = {
  type: DayStatusType;
  label: string;
  color: string;
  isSchoolDay: boolean;
  note?: string;
  badge?: string;
  dashed?: boolean;
};

const inRange = (key: string, from: string, to: string) => key >= from && key <= to;

export function getDayStatus(date: Date, s: CalendarSettings = defaultCalendarSettings()): DayStatus {
  const cal = ACTIVE_CALENDAR;
  const key = dateKey(date);
  const L = (ro: string, en: string) => (s.lang === "ro" ? ro : en);
  if (key < cal.firstDay)
    return { type: "before-year", label: L("Anul școlar începe pe 7 septembrie", "School year starts on 7 September"), color: "var(--cal-holiday)", isSchoolDay: false };
  if (key > cal.lastDayByGrade[s.grade])
    return { type: "summer", label: L("Vacanța de vară", "Summer break"), color: "var(--cal-vacation)", isSchoolDay: false };
  const off = s.daysOff.find((d) => d.date === key);
  if (off) return { type: "custom-off", label: off.label, color: "var(--cal-holiday)", isSchoolDay: false };
  const holiday = [...cal.legalHolidays, ...cal.extraDaysOff].find((h) => h.date === key);
  if (holiday) return { type: "holiday", label: L(holiday.ro, holiday.en), color: "var(--cal-holiday)", isSchoolDay: false };
  const vacation = cal.vacations.find((v) => inRange(key, v.from, v.to));
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  if (weekend)
    return {
      type: "weekend",
      label: vacation ? L("Weekend · în vacanță", "Weekend · on break") : "Weekend",
      color: vacation ? "var(--cal-vacation)" : "var(--cal-weekend)",
      isSchoolDay: false,
    };
  if (vacation) return { type: "vacation", label: L(vacation.ro, vacation.en), color: "var(--cal-vacation)", isSchoolDay: false };
  const countyIndex = cal.isjWeekOptions.findIndex((w) => inRange(key, w.from, w.to));
  if (countyIndex >= 0) {
    const label = L("Vacanță – o săptămână, la decizia ISJ/ISMB", "One-week break decided by the county inspectorate");
    if (s.countyWeek === "unknown")
      return {
        type: "county",
        label,
        color: "var(--cal-county)",
        isSchoolDay: true,
        dashed: true,
        note: L("O singură săptămână este liberă. Alege-o în Setări.", "Only one of these weeks is free. Choose it in Settings."),
      };
    if ((s.countyWeek === "A" ? 0 : 1) === countyIndex)
      return { type: "county", label, color: "var(--cal-county)", isSchoolDay: false };
  }
  const special = s.specialWeeks.find((w) => inRange(key, w.from, w.to));
  if (special)
    return {
      type: "special",
      label: special.label,
      color: "var(--cal-county)",
      isSchoolDay: special.lessonsApply,
      ...(special.lessonsApply ? {} : { note: L("Activități educaționale, fără orar obișnuit (confirmă cu școala).", "Educational activities, no regular timetable (confirm with school).") }),
    };
  const marker = cal.markers.find((m) => m.date === key);
  const lastDay = cal.lastDayMarkers.find((m) => m.date === key);
  const badge = marker ? L(marker.ro, marker.en) : lastDay ? L(lastDay.ro, lastDay.en) : undefined;
  return { type: "school", label: L("Zi de cursuri", "School day"), color: "var(--cal-school)", isSchoolDay: true, ...(badge ? { badge } : {}) };
}

export function isSchoolDay(date: Date, settings?: CalendarSettings): boolean {
  return getDayStatus(date, settings).isSchoolDay;
}

/** Always strictly after the supplied date; preserve local dates across DST. Skips weekends, vacations, holidays and weeks without lessons. */
export function nextSchoolDay(date: Date, settings?: CalendarSettings): Date | null {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  const last = ACTIVE_CALENDAR.lastDayByGrade[settings?.grade ?? "V-VII"];
  if (!Number.isFinite(next.getTime())) return null;
  do {
    next.setDate(next.getDate() + 1);
    if (dateKey(next) > last) return null;
  } while (!isSchoolDay(next, settings));
  return next;
}

/** Whole calendar days from `from` (default now) until `date`; negative when past. */
export function daysUntil(date: Date, from = new Date()): number {
  const a = new Date(from); a.setHours(12, 0, 0, 0);
  const b = new Date(date); b.setHours(12, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export type BreakInfo = { date: Date; label: string; days: number; type: DayStatusType };
/** Next vacation, holiday, county week, custom day off or summer break after `from`. */
export function nextBreak(from: Date, settings?: CalendarSettings): BreakInfo | null {
  let d = new Date(from);
  d.setHours(12, 0, 0, 0);
  for (let i = 0; i < 400; i++) {
    d.setDate(d.getDate() + 1);
    const st = getDayStatus(d, settings);
    if (st.type === "vacation" || st.type === "holiday" || st.type === "custom-off" || st.type === "summer" || (st.type === "county" && !st.isSchoolDay))
      return { date: new Date(d), label: st.label, days: daysUntil(d, from), type: st.type };
  }
  return null;
}

/** Timetable column index (Mon=0..Fri=4); -1 on weekends. Purely weekday-based. */
export const schoolDayIndex = (date: Date) => (date.getDay() >= 1 && date.getDay() <= 5 ? date.getDay() - 1 : -1);

export function weekStart(date: Date) {
  const day = new Date(date);
  day.setHours(12, 0, 0, 0);
  while (day.getDay() !== 1) day.setDate(day.getDate() - 1);
  return day;
}

export function formatSchoolDate(date: Date, lang: "ro" | "en") {
  return new Intl.DateTimeFormat(lang === "ro" ? "ro-RO" : "en-GB", { weekday: "long", day: "numeric", month: "long" }).format(date);
}
