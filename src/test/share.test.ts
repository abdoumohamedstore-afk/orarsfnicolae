import { describe, expect, it } from "vitest";
import { applyShare, codeFromFile, decodeShare, encodeShare, shareFile } from "@/lib/share";
import { emptyStudentData } from "@/lib/student-data";
import { exampleTimetable } from "@/lib/timetable";

const base = () => ({
  ...emptyStudentData(), timetable: exampleTimetable(),
  homework: [
    { id: "a", type: "homework" as const, subject: "TIC", title: "Ex 3", note: "secret", due: "2026-11-05", done: false },
    { id: "b", type: "test" as const, subject: "Istorie", title: "Old", note: "", due: "2026-10-01", done: false },
    { id: "c", type: "homework" as const, subject: "TIC", title: "Done one", note: "", due: "2026-11-06", done: true },
  ],
});
const all = { school: true, className: true, homework: true };
const lessons = (tt: ReturnType<typeof exampleTimetable>) => tt.days.map(d => d.map(l => `${l.time} ${l.subject}`).sort());

describe("QR share", () => {
  it("shares only timetable essentials by default", () => {
    const p = decodeShare(encodeShare(base(), "2026-11-01"))!;
    expect(p.timetable.school).toBe("");
    expect(p.timetable.className).toBe("");
    expect(p.homework).toEqual([]);
    expect(lessons(p.timetable)).toEqual(lessons(exampleTimetable()));
  });
  it("round-trips every lesson time and subject plus selected fields, never notes", () => {
    const p = decodeShare(encodeShare(base(), "2026-11-01", all))!;
    expect(p.timetable.className).toBe("V-A");
    expect(lessons(p.timetable)).toEqual(lessons(exampleTimetable()));
    expect(p.timetable.lessonLen).toBe(50);
    expect(p.homework.map(h => h.title)).toEqual(["Ex 3"]);
    expect(p.homework[0]?.note).toBe("");
  });
  it("round-trips through the share file", () => {
    const code = codeFromFile(shareFile(encodeShare(base(), "2026-11-01")))!;
    expect(lessons(decodeShare(code)!.timetable)).toEqual(lessons(exampleTimetable()));
    expect(codeFromFile("{}")).toBeNull();
  });
  it("rejects malformed codes", () => {
    expect(decodeShare("not-a-code")).toBeNull();
    expect(decodeShare(btoa(JSON.stringify({ v: 1, d: [] })))).toBeNull();
  });
  it("replace swaps the timetable; merge keeps it and adds missing lessons", () => {
    const p = decodeShare(encodeShare(base(), "2026-11-01", all))!;
    const mine = { ...emptyStudentData(), timetable: { ...exampleTimetable(), className: "Mine", days: [[{ id: "x", time: "07:00", subject: "Club" }], [], [], [], []] } };
    expect(applyShare(mine, p, "replace").timetable?.className).toBe("V-A");
    const merged = applyShare(mine, p, "merge").timetable!;
    expect(merged.className).toBe("Mine");
    expect(merged.days[0]?.length).toBe((exampleTimetable().days[0]?.length ?? 0) + 1);
    const again = applyShare({ ...mine, timetable: merged }, p, "merge").timetable!;
    expect(again.days[0]?.length).toBe(merged.days[0]?.length);
  });
  it("does not duplicate homework the receiver already has", () => {
    const p = decodeShare(encodeShare(base(), "2026-11-01", all))!;
    expect(applyShare(base(), p, "merge").homework).toHaveLength(3);
    expect(applyShare(emptyStudentData(), p, "replace").homework).toHaveLength(1);
  });
});
