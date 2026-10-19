import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dict, type Dict, type Lang } from "./i18n";
import type { Timetable } from "./timetable";

export type ThemePref = "auto" | "light" | "dark";

type Ctx = {
  ready: boolean;
  data: Timetable | null;
  setData: (t: Timetable) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  t: Dict;
};

const AppCtx = createContext<Ctx | null>(null);
const K = { data: "orar.timetable", lang: "orar.lang", theme: "orar.theme" };

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setDataState] = useState<Timetable | null>(null);
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setThemeState] = useState<ThemePref>("auto");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(K.data);
      if (raw) setDataState(JSON.parse(raw));
    } catch {}
    const l = localStorage.getItem(K.lang) as Lang | null;
    setLangState(l ?? (navigator.language?.toLowerCase().startsWith("ro") ? "ro" : "en"));
    setThemeState((localStorage.getItem(K.theme) as ThemePref) ?? "auto");
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "auto" && mq.matches));
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      data,
      setData: (t) => {
        setDataState(t);
        localStorage.setItem(K.data, JSON.stringify(t));
      },
      lang,
      setLang: (l) => {
        setLangState(l);
        localStorage.setItem(K.lang, l);
      },
      theme,
      setTheme: (t) => {
        setThemeState(t);
        localStorage.setItem(K.theme, t);
      },
      t: dict[lang],
    }),
    [ready, data, lang, theme],
  );
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}
