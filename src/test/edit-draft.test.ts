import { describe, expect, it } from "vitest";
import { applyStored } from "@/routes/edit";
import { emptyTimetable, exampleTimetable } from "@/lib/timetable";

const stored = exampleTimetable();

describe("edit draft merge", () => {
  it("applies the stored timetable to an untouched draft", () => {
    expect(applyStored(emptyTimetable(), stored).school).toBe(stored.school);
    expect(applyStored(emptyTimetable(), stored).className).toBe(stored.className);
  });
  it("keeps what the user already typed when the store arrives late", () => {
    const typed = { ...emptyTimetable(), school: "Liceul Test 1", className: "X-B" };
    const merged = applyStored(typed, stored);
    expect(merged.school).toBe("Liceul Test 1");
    expect(merged.className).toBe("X-B");
  });
  it("keeps a lesson the user added before the store arrived", () => {
    const typed = { ...emptyTimetable(), days: [[{ id: "x1", time: "08:00", subject: "Sport" }], [], [], [], []] };
    expect(applyStored(typed, stored).days[0]!.map((l) => l.subject)).toEqual(["Sport"]);
  });
  it("starts from a blank draft when nothing is stored", () => {
    expect(applyStored(emptyTimetable(), null).days.flat().length).toBe(0);
  });
});
