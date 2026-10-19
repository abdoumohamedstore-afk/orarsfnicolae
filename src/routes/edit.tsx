import { createFileRoute } from "@tanstack/react-router";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dot, Page, PageHeader } from "@/components/app-ui";
import { useApp } from "@/lib/store";
import { emptyTimetable, exampleTimetable, isEmpty, newId, nextLessonTime, type Lesson, type Timetable } from "@/lib/timetable";

export const Route = createFileRoute("/edit")({
  head: () => ({
    meta: [
      { title: "Edit timetable · Orar" },
      { name: "description", content: "Set up your school, class, lessons and times." },
      { property: "og:title", content: "Edit timetable · Orar" },
      { property: "og:description", content: "Set up your school, class, lessons and times." },
    ],
  }),
  component: Edit,
});

const field = "w-full rounded-full border border-input bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

function Row({ lesson, onChange, onRemove, label }: { lesson: Lesson; onChange: (l: Lesson) => void; onRemove: () => void; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1.5 ${isDragging ? "relative z-10 opacity-80" : ""}`}
    >
      <button {...attributes} {...listeners} aria-label="Reorder" className="touch-none p-1 text-muted-foreground">
        <GripVertical className="size-4" />
      </button>
      <input
        type="time"
        step={60}
        value={lesson.time}
        onChange={(e) => onChange({ ...lesson, time: e.target.value })}
        className="w-[74px] shrink-0 rounded-full bg-accent px-2 py-2.5 text-center text-sm font-semibold tabular-nums text-accent-foreground outline-none"
      />
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
          <Dot subject={lesson.subject || "?"} />
        </span>
        <input
          list="subjects"
          value={lesson.subject}
          placeholder={label}
          onChange={(e) => onChange({ ...lesson, subject: e.target.value })}
          className={`${field} pl-8`}
        />
      </div>
      <button onClick={onRemove} aria-label="Remove" className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-muted">
        <X className="size-4" />
      </button>
    </div>
  );
}

function Edit() {
  const { t, data, setData, ready } = useApp();
  const [draft, setDraft] = useState<Timetable>(emptyTimetable);
  useEffect(() => {
    if (ready) setDraft(data ? structuredClone(data) : emptyTimetable());
  }, [ready, data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const subjects = useMemo(
    () => [...new Set(draft.days.flat().map((l) => l.subject.trim()).filter(Boolean))].sort(),
    [draft],
  );

  const updDay = (i: number, fn: (d: Lesson[]) => Lesson[]) =>
    setDraft((d) => ({ ...d, days: d.days.map((day, j) => (j === i ? fn(day) : day)) }));

  const onDragEnd = (i: number) => (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    updDay(i, (day) => {
      const from = day.findIndex((l) => l.id === e.active.id);
      const to = day.findIndex((l) => l.id === e.over!.id);
      return arrayMove(day, from, to);
    });
  };

  const save = () => {
    setData({
      ...draft,
      lessonLen: Math.max(1, Number(draft.lessonLen) || 50),
      breakLen: Math.max(0, Number(draft.breakLen) || 0),
    });
    toast.success(t.saved);
  };

  return (
    <Page>
      <PageHeader title={t.edit} />
      <datalist id="subjects">
        {subjects.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {isEmpty(draft) && (
        <button
          onClick={() => setDraft(exampleTimetable())}
          className="glass-pill mb-4 w-full px-4 py-3 text-sm font-semibold text-primary"
        >
          {t.loadExample}
        </button>
      )}

      <section className="glass mb-5 grid grid-cols-2 gap-3 p-4">
        <label className="col-span-2 text-xs font-medium text-muted-foreground">
          {t.school}
          <input className={`${field} mt-1 text-foreground`} value={draft.school} onChange={(e) => setDraft({ ...draft, school: e.target.value })} />
        </label>
        <label className="col-span-2 text-xs font-medium text-muted-foreground">
          {t.className}
          <input className={`${field} mt-1 text-foreground`} value={draft.className} onChange={(e) => setDraft({ ...draft, className: e.target.value })} />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          {t.lessonLen}
          <input type="number" inputMode="numeric" min={1} className={`${field} mt-1 text-foreground`} value={draft.lessonLen} onChange={(e) => setDraft({ ...draft, lessonLen: Number(e.target.value) })} />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          {t.breakLen}
          <input type="number" inputMode="numeric" min={0} className={`${field} mt-1 text-foreground`} value={draft.breakLen} onChange={(e) => setDraft({ ...draft, breakLen: Number(e.target.value) })} />
        </label>
      </section>

      <div className="space-y-4">
        {draft.days.map((day, i) => (
          <section key={i} className="glass p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{t.days[i]}</h2>
              <select
                value=""
                onChange={(e) => {
                  const src = Number(e.target.value);
                  updDay(i, () => (draft.days[src] ?? []).map((l) => ({ ...l, id: newId() })));
                }}
                className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none"
              >
                <option value="" disabled>
                  {t.copyFrom}
                </option>
                {t.days.map((name, j) => (j !== i ? <option key={j} value={j}>{name}</option> : null))}
              </select>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd(i)}>
              <SortableContext items={day.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {day.map((l) => (
                    <Row
                      key={l.id}
                      lesson={l}
                      label={t.subject}
                      onChange={(nl) => updDay(i, (d) => d.map((x) => (x.id === l.id ? nl : x)))}
                      onRemove={() => updDay(i, (d) => d.filter((x) => x.id !== l.id))}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <button
              onClick={() =>
                updDay(i, (d) => [...d, { id: newId(), time: nextLessonTime(d, Number(draft.lessonLen) || 50, Number(draft.breakLen) || 0), subject: "" }])
              }
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground active:scale-95"
            >
              <Plus className="size-4" /> {t.addLesson}
            </button>
          </section>
        ))}
      </div>

      <div className="sticky bottom-24 z-30 mt-6 flex justify-center">
        <button
          onClick={save}
          className="rounded-full bg-primary px-10 py-3.5 font-semibold text-primary-foreground shadow-xl transition-transform active:scale-95"
        >
          {t.save}
        </button>
      </div>
    </Page>
  );
}
