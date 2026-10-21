import { dateKey, isSchoolDay, nextSchoolDay, schoolDayIndex } from "./schedule-days";
import { sortByTime, toMin } from "./timetable";
import type { StudentData } from "./student-data";
export function dueReminders(state: StudentData, now: Date): { id: string; kind: "lesson" | "packing"; subject?: string }[] {
  if (!isSchoolDay(now)) return [];
  const result: { id: string; kind: "lesson" | "packing"; subject?: string }[] = [];
  const minute = now.getHours() * 60 + now.getMinutes();
  if (state.reminders.lessons) for (const lesson of sortByTime(state.timetable?.days[schoolDayIndex(now)] ?? [])) {
    if (minute === toMin(lesson.time) - 5) result.push({ id: `${dateKey(now)}:lesson:${lesson.id}`, kind: "lesson", subject: lesson.subject });
  }
  if (state.reminders.evening && minute === toMin(state.reminders.time) && nextSchoolDay(now)) result.push({ id: `${dateKey(now)}:packing`, kind: "packing" });
  return result;
}
