/**
 * Official Romanian school-year calendar 2026-2027.
 * Keep one file per school year; schedule-days.ts reads the active one.
 */
export const CALENDAR_2026_2027 = {
  schoolYear: "2026-2027",
  firstDay: "2026-09-07",
  lastDayByGrade: { "V-VII": "2027-06-18", VIII: "2027-06-11", "XII-XIII": "2027-06-04" },
  vacations: [
    { id: "autumn", ro: "Vacanța de toamnă", en: "Autumn break", from: "2026-10-26", to: "2026-10-30" },
    { id: "winter", ro: "Vacanța de iarnă", en: "Winter break", from: "2026-12-23", to: "2027-01-08" },
    { id: "spring", ro: "Vacanța de primăvară (Paște)", en: "Spring / Easter break", from: "2027-04-26", to: "2027-05-04" },
  ],
  isjWeekOptions: [
    { from: "2027-02-15", to: "2027-02-19" },
    { from: "2027-02-22", to: "2027-02-26" },
  ],
  legalHolidays: [
    { date: "2026-11-30", ro: "Sfântul Apostol Andrei", en: "St. Andrew's Day" },
    { date: "2026-12-01", ro: "Ziua Națională a României", en: "Romania's National Day" },
    { date: "2026-12-25", ro: "Crăciunul", en: "Christmas Day" },
    { date: "2026-12-26", ro: "A doua zi de Crăciun", en: "Second day of Christmas" },
    { date: "2027-01-01", ro: "Anul Nou", en: "New Year's Day" },
    { date: "2027-01-02", ro: "A doua zi de Anul Nou", en: "Second day of New Year" },
    { date: "2027-01-06", ro: "Boboteaza", en: "Epiphany" },
    { date: "2027-01-07", ro: "Sfântul Ioan Botezătorul", en: "St. John the Baptist" },
    { date: "2027-04-30", ro: "Vinerea Mare", en: "Good Friday (Orthodox)" },
    { date: "2027-05-01", ro: "Ziua Muncii", en: "Labour Day" },
    { date: "2027-05-02", ro: "Paștele ortodox", en: "Orthodox Easter" },
    { date: "2027-05-03", ro: "A doua zi de Paște", en: "Easter Monday" },
    { date: "2027-06-01", ro: "Ziua Copilului", en: "Children's Day" },
  ],
  extraDaysOff: [
    { date: "2027-05-04", ro: "Zi liberă (conform structurii anului școlar)", en: "Day off (per the school-year structure)" },
  ],
  markers: [
    { date: "2026-10-05", ro: "Ziua Educației", en: "World Teachers' Day", classesHeld: true },
    { date: "2027-03-28", ro: "Paștele catolic", en: "Catholic Easter", classesHeld: true },
  ],
  lastDayMarkers: [
    { date: "2027-06-04", ro: "Ultima zi de cursuri: clasele a XII-a (zi), a XIII-a (seral) și frecvență redusă", en: "Last day of classes: grade XII (day), XIII (evening) and reduced attendance" },
    { date: "2027-06-11", ro: "Ultima zi de cursuri: clasa a VIII-a", en: "Last day of classes: grade VIII" },
    { date: "2027-06-18", ro: "Ultima zi de cursuri", en: "Last day of classes" },
  ],
} as const;

export type SchoolCalendar = typeof CALENDAR_2026_2027;
export const ACTIVE_CALENDAR: SchoolCalendar = CALENDAR_2026_2027;
