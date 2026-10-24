import { dateKey, isSchoolDay, nextSchoolDay, schoolDayIndex } from "./schedule-days";
import { sortByTime, toMin } from "./timetable";
import { settingsOf, type StudentData } from "./student-data";
export function dueReminders(state: StudentData, now: Date): { id: string; kind: "lesson" | "packing"; subject?: string; date?: string }[] {
  const settings = settingsOf(state);
  if (!isSchoolDay(now, settings)) return [];
  const result: { id: string; kind: "lesson" | "packing"; subject?: string; date?: string }[] = [];
  const minute = now.getHours() * 60 + now.getMinutes();
  if (state.reminders.lessons) for (const lesson of sortByTime(state.timetable?.days[schoolDayIndex(now)] ?? [])) {
    if (minute === toMin(lesson.time) - 5) result.push({ id: `${dateKey(now)}:lesson:${lesson.id}`, kind: "lesson", subject: lesson.subject });
  }
  const next = nextSchoolDay(now, settings);
  if (state.reminders.evening && minute === toMin(state.reminders.time) && next) result.push({ id: `${dateKey(now)}:packing`, kind: "packing", date: dateKey(next) });
  return result;
}
