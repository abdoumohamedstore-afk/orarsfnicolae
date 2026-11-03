import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Calendar, BookOpen, Settings, Sun, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useApp } from "@/lib/store";
import { exampleTimetable, subjectColor } from "@/lib/timetable";

export function Dot({ subject, className = "" }: { subject: string; className?: string }) {
  return (
    <span
      className={`inline-block size-2.5 shrink-0 rounded-full ${className}`}
      style={{ background: subjectColor(subject) }}
    />
  );
}

export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  const { t } = useApp();
  return (
    <header className="flex items-center justify-between pb-4 pt-2">
      <h1 className="type-title">{title}</h1>
      {right ?? (
        <Link
          to="/settings"
          aria-label={t.settings}
          className="glass-pill grid size-11 place-items-center text-foreground transition-transform active:scale-95"
        >
          <Settings className="size-5" />
        </Link>
      )}
    </header>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-32 pt-[max(env(safe-area-inset-top),12px)] fade-up">
      {children}
    </main>
  );
}

export function EmptyState() {
  const { t, setData } = useApp();
  return (
    <div className="glass flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
        <CalendarDays className="size-7" />
      </div>
      <h2 className="text-xl font-semibold">{t.emptyTitle}</h2>
      <p className="text-sm text-muted-foreground">{t.emptyBody}</p>
      <Button
        onClick={() => setData(exampleTimetable())}
        className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform active:scale-95"
      >
        {t.loadExample}
      </Button>
    </div>
  );
}

export function TabBar() {
  const { t } = useApp();
  const tabs = [
    { to: "/" as const, label: t.today, icon: Sun },
    { to: "/week" as const, label: t.week, icon: CalendarDays },
    { to: "/calendar" as const, label: t.calendar, icon: Calendar },
    { to: "/homework" as const, label: t.homework, icon: BookOpen },
    { to: "/settings" as const, label: t.settings, icon: Settings },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
      <div className="glass-pill grid w-full max-w-xl grid-cols-5 gap-1 p-1.5">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            className="flex min-w-0 flex-col items-center gap-1 rounded-full px-1 py-2 text-[11px] font-semibold min-h-11 text-muted-foreground transition-all"
            activeProps={{ className: "bg-primary !text-primary-foreground shadow-md" }}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function InstallHint() {
  const { t, ready } = useApp();
  const [show, setShow] = useState<null | "ios" | "android">(null);
  useEffect(() => {
    if (!ready) return;
    const ua = navigator.userAgent;
    const mobile = /iphone|ipad|ipod|android/i.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone;
    if (mobile && !standalone && !localStorage.getItem("orar.installHint")) {
      setShow(/iphone|ipad|ipod/i.test(ua) ? "ios" : "android");
    }
  }, [ready]);
  if (!show) return null;
  const close = () => {
    localStorage.setItem("orar.installHint", "1");
    setShow(null);
  };
  return (
    <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 fade-up">
      <div className="glass flex w-full max-w-md items-start gap-3 bg-glass-strong p-4">
        <img src="/icon-192.png" alt="" width={44} height={44} className="size-11 rounded-xl" />
        <div className="flex-1">
          <p className="text-sm font-semibold">{t.installTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{show === "ios" ? t.installIos : t.installAndroid}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={close} aria-label={t.gotIt} className="rounded-full p-1 text-muted-foreground">
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
