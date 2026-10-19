import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dot, EmptyState, Page, PageHeader } from "@/components/app-ui";
import { useApp } from "@/lib/store";
import { dayIndexOf, isEmpty, shortSubject, sortByTime } from "@/lib/timetable";

export const Route = createFileRoute("/week")({
  head: () => ({
    meta: [
      { title: "Week · Orar" },
      { name: "description", content: "Your whole school week in one compact grid." },
      { property: "og:title", content: "Week · Orar" },
      { property: "og:description", content: "Your whole school week in one compact grid." },
    ],
  }),
  component: Week,
});

function Week() {
  const { t, data, ready } = useApp();
  const [todayIdx, setTodayIdx] = useState(-1);
  useEffect(() => setTodayIdx(dayIndexOf(new Date())), []);
  if (!ready) return <Page><PageHeader title={t.week} /></Page>;
  if (!data || isEmpty(data))
    return (
      <Page>
        <PageHeader title={t.week} />
        <EmptyState />
      </Page>
    );

  return (
    <Page>
      <PageHeader title={t.week} />
      <div className="glass grid grid-cols-5 gap-1.5 p-2">
        {data.days.map((day, i) => {
          const lessons = sortByTime(day);
          const isToday = i === todayIdx;
          return (
            <div
              key={i}
              className={`flex min-w-0 flex-col gap-1.5 rounded-2xl border-2 p-1 ${
                isToday ? "border-primary bg-accent" : "border-transparent"
              }`}
            >
              <div className="pb-1 pt-1 text-center">
                <p className={`text-xs font-bold ${isToday ? "text-primary" : ""}`}>{t.daysShort[i]}</p>
                <p className="text-[10px] tabular-nums text-muted-foreground">{lessons[0]?.time ?? "—"}</p>
              </div>
              {lessons.map((l) => (
                <div
                  key={l.id}
                  className="glass-pill flex min-w-0 items-center gap-1 px-1.5 py-1.5 !shadow-none"
                  title={`${l.time} ${l.subject}`}
                >
                  <Dot subject={l.subject} className="!size-1.5" />
                  <span className="truncate text-[10px] font-semibold leading-tight">{shortSubject(l.subject)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Page>
  );
}
