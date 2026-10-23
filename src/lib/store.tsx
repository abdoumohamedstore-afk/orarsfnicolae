import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dict, type Dict, type Lang } from "./i18n";
import type { Timetable } from "./timetable";
import { emptyStudentData, importBackup, type StudentData } from "./student-data";
export type ThemePref = "auto" | "light" | "dark";
type Ctx = {
  ready: boolean; data: Timetable | null; setData: (t: Timetable) => void;
  state: StudentData; update: (fn: (s: StudentData) => StudentData) => void;
  replace: (s: StudentData) => void; reset: () => void; storageError: boolean;
  lang: Lang; setLang: (l: Lang) => void; theme: ThemePref; setTheme: (t: ThemePref) => void; t: Dict;
};
const AppCtx = createContext<Ctx | null>(null);
export const STORAGE_KEY = "orar.student.v1";
export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<StudentData>(emptyStudentData);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    const base = emptyStudentData();
    base.lang = navigator.language.toLowerCase().startsWith("ro") ? "ro" : "en";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(importBackup(JSON.parse(raw)));
      else {
        const lang = localStorage.getItem("orar.lang"); const theme = localStorage.getItem("orar.theme");
        if (lang === "ro" || lang === "en") base.lang = lang;
        if (theme === "auto" || theme === "light" || theme === "dark") base.theme = theme;
        const old = localStorage.getItem("orar.timetable");
        setState(old ? importBackup(JSON.parse(old), base) : base);
      }
    } catch { setStorageError(true); setState(base); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || storageError) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { setStorageError(true); }
  }, [state, ready, storageError]);
  useEffect(() => { document.documentElement.lang = state.lang; }, [state.lang]);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", state.theme === "dark" || (state.theme === "auto" && mq.matches));
    apply(); mq.addEventListener("change", apply); return () => mq.removeEventListener("change", apply);
  }, [state.theme]);
  const value = useMemo<Ctx>(() => ({ ready, state, storageError, data: state.timetable,
    update: setState, replace: s => { setStorageError(false); setState(s); },
    reset: () => { localStorage.removeItem("orar.timetable"); localStorage.removeItem("orar.lang"); localStorage.removeItem("orar.theme"); localStorage.removeItem("orar.installHint"); setStorageError(false); setState({ ...emptyStudentData(), lang: state.lang, theme: state.theme }); },
    setData: timetable => setState(s => ({ ...s, timetable })),
    lang: state.lang, setLang: lang => setState(s => ({ ...s, lang })),
    theme: state.theme, setTheme: theme => setState(s => ({ ...s, theme })), t: dict[state.lang],
  }), [ready, state, storageError]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
export function useApp() { const ctx = useContext(AppCtx); if (!ctx) throw new Error("useApp outside provider"); return ctx; }
