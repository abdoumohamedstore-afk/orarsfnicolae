import { describe, expect, it } from "vitest";
import { applyShare, decodeShare, encodeShare } from "@/lib/share";
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

describe("QR share", () => {
  it("round-trips the timetable and only open, upcoming homework without notes", () => {
    const p = decodeShare(encodeShare(base(), "2026-11-01", true));
    expect(p?.timetable.className).toBe("V-A");
    expect(p?.timetable.days[3]?.[0]?.time).toBe("12:00");
    expect(p?.homework.map(h => h.title)).toEqual(["Ex 3"]);
    expect(p?.homework[0]?.note).toBe("");
  });
  it("omits homework when the sender turns it off", () => {
    expect(decodeShare(encodeShare(base(), "2026-11-01", false))?.homework).toEqual([]);
  });
  it("rejects malformed codes", () => {
    expect(decodeShare("not-a-code")).toBeNull();
    expect(decodeShare(btoa(JSON.stringify({ v: 1, d: [] })))).toBeNull();
  });
  it("does not duplicate homework the receiver already has", () => {
    const p = decodeShare(encodeShare(base(), "2026-11-01", true))!;
    expect(applyShare(base(), p).homework).toHaveLength(3);
    expect(applyShare(emptyStudentData(), p).homework).toHaveLength(1);
  });
});
