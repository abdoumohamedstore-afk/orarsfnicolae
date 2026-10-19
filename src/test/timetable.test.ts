import { describe, expect, it } from "vitest";
import { exampleTimetable, getStatus, nextLessonTime, subjectColorIndex } from "@/lib/timetable";

const at = (y: number, mo: number, d: number, h: number, mi: number) => new Date(y, mo - 1, d, h, mi);
const tt = exampleTimetable();
// 2026-10-19 is a Monday

describe("timetable rules", () => {
  it("new lesson time = previous + lesson + break", () => {
    expect(nextLessonTime(tt.days[0]!, 50, 10)).toBe("17:00");
  });
  it("same subject always same color", () => {
    expect(subjectColorIndex("Matematică")).toBe(subjectColorIndex("matematică "));
  });
  it("during a lesson shows minutes left and next", () => {
    const s = getStatus(tt, at(2026, 10, 19, 11, 20));
    expect(s.kind).toBe("lesson");
    if (s.kind === "lesson") {
      expect(s.minsLeft).toBe(30);
      expect(s.next?.subject).toBe("Ed. fizică");
    }
  });
  it("during a break counts to next lesson", () => {
    const s = getStatus(tt, at(2026, 10, 19, 11, 55));
    expect(s.kind === "break" && s.minsUntil).toBe(5);
  });
  it("before school shows first subject", () => {
    const s = getStatus(tt, at(2026, 10, 19, 8, 0));
    expect(s.kind === "before" && s.first.subject).toBe("Matematică");
  });
  it("friday evening points to monday", () => {
    const s = getStatus(tt, at(2026, 10, 23, 20, 0));
    expect(s.kind === "upcoming" && s.dayIndex).toBe(0);
  });
});
