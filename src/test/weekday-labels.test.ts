import { describe, expect, it } from "vitest";
import { dict } from "@/lib/i18n";
import { dateKey, formatSchoolDate, parseDate } from "@/lib/schedule-days";

describe("weekday labels", () => {
  it("uses Monday-first localized abbreviations", () => {
    expect(dict.en.daysShort).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(dict.ro.daysShort).toEqual(["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"]);
    expect(dict.ro.days[0]).toBe("Luni");
    expect(dict.en.days[6]).toBe("Sunday");
  });
  it("changing language changes formatting but not the stored date", () => {
    const d = parseDate("2026-09-07");
    expect(formatSchoolDate(d, "ro")).toMatch(/luni/i);
    expect(formatSchoolDate(d, "en")).toMatch(/Monday/);
    expect(dateKey(d)).toBe("2026-09-07");
  });
});
