import { describe, expect, it } from "vitest";
import { dateKey, isSchoolDay, nextSchoolDay, parseDate } from "@/lib/schedule-days";
import { emptyStudentData, homeworkSchema, importBackup, nextSubjectDate, packingItems, studentSchema } from "@/lib/student-data";
import { emptyTimetable, exampleTimetable } from "@/lib/timetable";
import { dueReminders } from "@/lib/reminders";
import { buildIcs } from "@/lib/ics";

describe("Part 1 student rules", () => {
  it("school days are Monday through Friday only", () => {
    expect(Array.from({ length: 7 }, (_, i) => isSchoolDay(new Date(2026, 9, 19 + i)))).toEqual([true, true, true, true, true, false, false]);
  });
  it("Friday packing skips autumn break across the October clock change", () => {
    const next = nextSchoolDay(parseDate("2026-10-23"));
    expect(next && dateKey(next)).toBe("2026-11-02");
  });
  it("defaults to 50 minute lessons, 10 minute breaks and a 20:00 packing reminder", () => {
    expect(emptyTimetable()).toMatchObject({ lessonLen: 50, breakLen: 10 });
    expect(emptyStudentData().reminders.time).toBe("20:00");
  });
  it("homework defaults to the next lesson of the chosen subject", () => {
    expect(nextSubjectDate(exampleTimetable(), "TIC", parseDate("2026-10-22"))).toBe("2026-11-05");
  });
  it("deduplicates materials and includes unfinished homework and extras for the target date", () => {
    const state = emptyStudentData(); state.timetable = exampleTimetable();
    state.materials = { "Matematică": ["Notebook", " ruler ", "notebook"], "Ed. fizică": ["Notebook", "Shoes"] };
    state.homework = [{ id: "hw", type: "homework", subject: "Matematică", title: "Exercises", note: "", due: "2026-10-26", done: false }, { id: "old", type: "homework", subject: "Matematică", title: "Old", note: "", due: "2026-10-23", done: false }];
    state.packing["2026-10-26"] = { checked: ["material:notebook"], extras: [{ id: "water", title: "Water" }] };
    expect(packingItems(state, parseDate("2026-10-26")).map(x => x.title)).toEqual(["Notebook", "ruler", "Shoes", "Exercises", "Water"]);
    expect(state.packing["2026-10-27"]?.checked ?? []).toEqual([]);
  });
  it("requires a real due date, subject and title", () => {
    const item = { id: "hw", type: "homework", subject: "Math", title: "Exercises", note: "", due: "2026-02-30", done: false };
    expect(homeworkSchema.safeParse(item).success).toBe(false);
    expect(homeworkSchema.safeParse({ ...item, due: "2026-02-28" }).success).toBe(true);
    expect(homeworkSchema.safeParse({ ...item, due: "2026-02-28", title: " " }).success).toBe(false);
  });
  it("preserves full backups and accepts legacy timetable exports", () => {
    const state = emptyStudentData(); state.timetable = exampleTimetable(); state.lang = "ro";
    expect(importBackup(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(importBackup(exampleTimetable(), state).lang).toBe("ro");
    expect(() => importBackup({ ...state, version: 99 })).toThrow();
    expect(studentSchema.safeParse({ ...state, homework: [{ due: "bad" }] }).success).toBe(false);
  });
  it("fires a lesson reminder exactly five minutes before class", () => {
    const state = emptyStudentData(); state.timetable = exampleTimetable(); state.reminders.lessons = true;
    expect(dueReminders(state, new Date(2026, 9, 19, 10, 55))).toEqual([{ id: `2026-10-19:lesson:${state.timetable.days[0]?.[0]?.id}`, kind: "lesson", subject: "Matematică" }]);
    expect(dueReminders(state, new Date(2026, 9, 19, 10, 54))).toEqual([]);
  });
  it("never sends weekend reminders, including evening packing", () => {
    const state = emptyStudentData(); state.reminders = { lessons: true, evening: true, time: "20:00" };
    expect(dueReminders(state, new Date(2026, 9, 24, 20, 0))).toEqual([]);
    expect(dueReminders(state, new Date(2026, 9, 25, 20, 0))).toEqual([]);
    expect(dueReminders(state, new Date(2026, 9, 23, 20, 0))).toEqual([{ id: "2026-10-23:packing", kind: "packing", date: "2026-11-02" }]);
  });
  it("exports Bucharest weekly events with five minute alarms and valid midnight endings", () => {
    const tt = emptyTimetable(); tt.days[0] = [{ id: "late", subject: "Math", time: "23:30" }];
    const ics = buildIcs(tt, "starts in 5 minutes", parseDate("2026-10-19"));
    expect(ics).toContain("DTSTART;TZID=Europe/Bucharest:20261019T233000");
    expect(ics).toContain("DTEND;TZID=Europe/Bucharest:20261020T002000");
    expect(ics).toContain("RRULE:FREQ=WEEKLY"); expect(ics).toContain("TRIGGER:-PT5M");
  });
});