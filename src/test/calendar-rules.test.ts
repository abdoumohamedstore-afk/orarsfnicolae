import { describe, expect, it } from "vitest";
import { dateKey, defaultCalendarSettings, getDayStatus, nextSchoolDay, parseDate } from "@/lib/schedule-days";
import { dayOffSchema, emptyStudentData, importBackup, nextSubjectDate, settingsOf, specialWeekSchema } from "@/lib/student-data";
import { exampleTimetable, getStatus } from "@/lib/timetable";
import { dueReminders } from "@/lib/reminders";
import { buildIcs } from "@/lib/ics";

describe("Romanian school calendar 2026–2027", () => {
  const settings = defaultCalendarSettings();
  it.each([
    ["2026-09-05", "before-year", "Anul școlar începe pe 7 septembrie", false],
    ["2026-09-07", "school", "Zi de cursuri", true],
    ["2026-10-28", "vacation", "Vacanța de toamnă", false],
    ["2026-11-02", "school", "Zi de cursuri", true],
    ["2026-11-30", "holiday", "Sfântul Apostol Andrei", false],
    ["2026-12-01", "holiday", "Ziua Națională a României", false],
    ["2026-12-24", "vacation", "Vacanța de iarnă", false],
    ["2026-12-25", "holiday", "Crăciunul", false],
    ["2027-01-06", "holiday", "Boboteaza", false],
    ["2027-01-11", "school", "Zi de cursuri", true],
    ["2027-02-17", "county", "Vacanță – o săptămână, la decizia ISJ/ISMB", true],
    ["2027-04-28", "vacation", "Vacanța de primăvară (Paște)", false],
    ["2027-04-30", "holiday", "Vinerea Mare", false],
    ["2027-05-03", "holiday", "A doua zi de Paște", false],
    ["2027-05-04", "holiday", "Zi liberă (conform structurii anului școlar)", false],
    ["2027-05-05", "school", "Zi de cursuri", true],
    ["2027-06-01", "holiday", "Ziua Copilului", false],
    ["2027-06-18", "school", "Zi de cursuri", true],
    ["2027-06-19", "summer", "Vacanța de vară", false],
  ])("%s has the specified status", (key, type, label, school) => {
    expect(getDayStatus(parseDate(String(key)), settings)).toMatchObject({ type, label, isSchoolDay: school });
  });
  it("keeps education day classes and its orange badge", () => {
    expect(getDayStatus(parseDate("2026-10-05"), settings)).toMatchObject({ isSchoolDay: true, badge: "Ziua Educației" });
  });
  it("marks the final class day", () => {
    expect(getDayStatus(parseDate("2027-06-18"), settings).badge).toBe("Ultima zi de cursuri");
  });
  it.each([["2026-10-24", "2026-11-02"], ["2026-12-22", "2027-01-11"]])("nextSchoolDay(%s) skips the entire break", (input, expected) => {
    const next = nextSchoolDay(parseDate(input), settings);
    expect(next ? dateKey(next) : null).toBe(expected);
  });
  it("unknown county weeks stay school days with a warning; only the selected week is off", () => {
    expect(getDayStatus(parseDate("2027-02-17"), settings)).toMatchObject({ isSchoolDay: true, dashed: true });
    expect(getDayStatus(parseDate("2027-02-17"), { ...settings, countyWeek: "A" }).isSchoolDay).toBe(false);
    expect(getDayStatus(parseDate("2027-02-24"), { ...settings, countyWeek: "A" }).isSchoolDay).toBe(true);
    expect(getDayStatus(parseDate("2027-02-24"), { ...settings, countyWeek: "B" }).isSchoolDay).toBe(false);
  });
  it.each([["VIII", "2027-06-11", "2027-06-12"], ["XII-XIII", "2027-06-04", "2027-06-05"]] as const)("respects %s year end", (grade, last, after) => {
    expect(getDayStatus(parseDate(last), { ...settings, grade }).isSchoolDay).toBe(true);
    expect(getDayStatus(parseDate(after), { ...settings, grade }).type).toBe("summer");
    expect(nextSchoolDay(parseDate(last), { ...settings, grade })).toBeNull();
  });
  it("special-week lesson toggle and custom closure priority apply", () => {
    const special = { id: "green", label: "Săptămâna verde", from: "2026-11-02", to: "2026-11-06", lessonsApply: false };
    expect(getDayStatus(parseDate("2026-11-03"), { ...settings, specialWeeks: [special] }).isSchoolDay).toBe(false);
    expect(getDayStatus(parseDate("2026-11-03"), { ...settings, specialWeeks: [{ ...special, lessonsApply: true }] }).isSchoolDay).toBe(true);
    expect(getDayStatus(parseDate("2026-11-30"), { ...settings, daysOff: [{ id: "snow", date: "2026-11-30", label: "Snow closure" }] }).label).toBe("Snow closure");
  });
  it("homework and Today respect stored county and closure settings", () => {
    const state = emptyStudentData(); state.timetable = exampleTimetable(); state.countyWeek = "A";
    state.daysOff = [{ id: "off", date: "2027-02-22", label: "Snow" }];
    expect(nextSubjectDate(state.timetable, "Matematică", parseDate("2027-02-12"), settingsOf(state))).toBe("2027-02-23");
    expect(getStatus(state.timetable, new Date(2027, 1, 17, 11, 20), settingsOf(state)).kind).toBe("upcoming");
  });
  it("reminders skip holidays, vacations, selected county weeks and custom closures", () => {
    const state = emptyStudentData(); state.timetable = exampleTimetable(); state.reminders = { lessons: true, evening: true, time: "20:00" }; state.countyWeek = "A";
    state.daysOff = [{ id: "off", date: "2026-11-02", label: "Snow" }];
    for (const key of ["2026-10-28", "2026-11-30", "2027-02-17", "2026-11-02"]) {
      const now = parseDate(key); now.setHours(20, 0); expect(dueReminders(state, now)).toEqual([]);
    }
    expect(dueReminders(state, new Date(2026, 9, 23, 20, 0))[0]?.date).toBe("2026-11-03");
  });
  it("exports holiday exceptions, bounded recurrence and all-day breaks", () => {
    const ics = buildIcs(exampleTimetable(), "reminder", parseDate("2026-09-07"), { ...settings, countyWeek: "A" });
    expect(ics).toContain("EXDATE;TZID=Europe/Bucharest:20261026T110000");
    expect(ics).toContain("EXDATE;TZID=Europe/Bucharest:20261130T110000");
    expect(ics).toContain("EXDATE;TZID=Europe/Bucharest:20270215T110000");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;UNTIL=20270618T205959Z");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261026\r\nDTEND;VALUE=DATE:20261031");
    expect(ics).toContain("SUMMARY:Crăciunul");
    expect(ics).not.toContain("UID:orar-calendar-county-1@orar");
  });
  it("unknown county export remains tentative without excluding lessons", () => {
    const ics = buildIcs(exampleTimetable(), "reminder", parseDate("2026-09-07"), settings);
    expect(ics).toContain("STATUS:TENTATIVE");
    expect(ics).not.toContain("EXDATE;TZID=Europe/Bucharest:20270215T110000");
  });
  it("validates calendar settings in forms and backup imports", () => {
    const invalid = { id: "x", label: "Green", from: "2027-03-05", to: "2027-03-01", lessonsApply: false };
    expect(specialWeekSchema.safeParse(invalid).success).toBe(false);
    expect(dayOffSchema.safeParse({ id: "x", date: "2027-02-30", label: "Snow" }).success).toBe(false);
    expect(() => importBackup({ ...emptyStudentData(), specialWeeks: [invalid] })).toThrow();
  });
  it("no future year is invented after summer begins", () => {
    expect(nextSchoolDay(parseDate("2027-06-19"))).toBeNull();
    expect(getStatus(exampleTimetable(), parseDate("2027-06-19")).kind).toBe("none");
    expect(nextSubjectDate(exampleTimetable(), "TIC", parseDate("2027-06-19"))).toBe("");
  });
});