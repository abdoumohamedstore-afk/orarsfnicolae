import { Packing, HomeworkPreview } from "@/components/packing";
import { isSchoolDay, nextSchoolDay, formatSchoolDate, schoolDayIndex } from "@/lib/schedule-days";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dot, EmptyState, Page, PageHeader } from "@/components/app-ui";
import { useApp } from "@/lib/store";
import { dayIndexOf, fromMin, getStatus, isEmpty, lessonState, sortByTime, toMin } from "@/lib/timetable";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today · Orar" },
      { name: "description", content: "What lesson is now, what's next, and today's schedule." },
      { property: "og:title", content: "Today · Orar" },
      { property: "og:description", content: "What lesson is now, what's next, and today's schedule." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Today,
});

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Today() {
  const { t, data, ready, lang } = useApp();
  const now = useNow();
  if (!ready || !now) return <Page><PageHeader title={t.today} /></Page>;
  if (!data || isEmpty(data))
    return (
      <Page>
        <PageHeader title={t.today} />
        <EmptyState />
      </Page>
    );

  const status = getStatus(data, now);
  const nextDay = nextSchoolDay(now);
  const nextFirst = sortByTime(data.days[schoolDayIndex(nextDay)])[0];
  const finished = isSchoolDay(now) && status.kind === "upcoming";
  const di = dayIndexOf(now);
  const today = di >= 0 ? sortByTime(data.days[di]) : [];
  const label = [data.school, data.className].filter(Boolean).join(" · ");

  return (
    <Page>
      <PageHeader title={t.today} />
      {label && (
        <div className="glass-pill mb-4 inline-flex max-w-full px-4 py-2 text-xs font-medium text-muted-foreground">
          <span className="truncate">{label}</span>
        </div>
      )}

      <section className="glass mb-6 p-6">
        {status.kind === "lesson" && (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t.now}</p>
            <div className="mt-1 flex items-center gap-3">
              <Dot subject={status.lesson.subject} className="size-3.5" />
              <h2 className="min-w-0 break-words text-3xl font-bold ">{status.lesson.subject}</h2>
            </div>
            <p className="mt-2 text-muted-foreground">{t.minLeft(status.minsLeft)}</p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${Math.min(100, status.progress * 100)}%` }}
              />
            </div>
            <p className="mt-4 text-sm">
              {status.next ? (
                <>
                  <span className="text-muted-foreground">{t.next}: </span>
                  <span className="font-semibold">{status.next.subject}</span>
                  <span className="text-muted-foreground"> · {status.next.time}</span>
                </>
              ) : (
                <span className="text-muted-foreground">{t.lastLesson}</span>
              )}
            </p>
          </>
        )}
        {status.kind === "break" && (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t.breakTitle}</p>
            <h2 className="mt-1 text-3xl font-bold ">{t.nextIn(status.minsUntil)}</h2>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Dot subject={status.next.subject} />
              <span className="text-muted-foreground">{t.next}:</span>
              <span className="font-semibold">{status.next.subject}</span>
              <span className="text-muted-foreground">· {status.next.time}</span>
            </p>
          </>
        )}
        {status.kind === "before" && (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t.startsAt(status.first.time)}</p>
            <div className="mt-1 flex items-center gap-3">
              <Dot subject={status.first.subject} className="size-3.5" />
              <h2 className="min-w-0 break-words text-3xl font-bold ">{status.first.subject}</h2>
            </div>
            <p className="mt-2 text-muted-foreground">{t.startsIn(status.minsUntil)}</p>
          </>
        )}
        {!isSchoolDay(now) ? (<><h2 className="text-2xl font-bold">{t.noClasses}</h2><p className="mt-3 text-sm text-muted-foreground">{t.nextSchool}: {formatSchoolDate(nextDay, lang)}</p>{nextFirst && <p className="mt-3 font-semibold">{nextFirst.time} · {nextFirst.subject}</p>}</>) : finished ? (<h2 className="text-2xl font-bold">{t.finished}</h2>) : status.kind === "upcoming" && (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {status.isTomorrow ? t.tomorrow : t.days[status.dayIndex]}
            </p>
            <h2 className="mt-1 text-3xl font-bold ">{t.startsAt(status.lessons[0]?.time ?? "")}</h2>
            <ul className="mt-4 space-y-2">
              {status.lessons.map((l) => (
                <li key={l.id} className="flex items-center gap-3 text-sm">
                  <span className="w-11 tabular-nums text-muted-foreground">{l.time}</span>
                  <Dot subject={l.subject} />
                  <span className="font-medium">{l.subject}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {status.kind === "none" && <p className="text-muted-foreground">{t.noSchool}</p>}
      </section>

      {di >= 0 && (
        <>
          <h3 className="mb-3 px-1 text-lg font-semibold">{t.todayLessons}</h3>
          {today.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">{t.noLessonsToday}</p>
          ) : (
            <ul className="space-y-2">
              {today.map((l) => {
                const st = lessonState(l, data, now);
                return (
                  <li
                    key={l.id}
                    className={`glass flex items-center gap-3 !rounded-full px-5 py-3.5 transition-all ${
                      st === "current" ? "ring-2 ring-primary" : ""
                    } ${st === "past" ? "opacity-45" : ""}`}
                  >
                    <Dot subject={l.subject} />
                    <span className="w-24 text-sm tabular-nums text-muted-foreground">
                      {l.time}–{fromMin(toMin(l.time) + data.lessonLen)}
                    </span>
                    <span className="flex-1 truncate font-semibold">{l.subject}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      <HomeworkPreview now={now} />
      <Packing now={now} />
    </Page>
  );
}
