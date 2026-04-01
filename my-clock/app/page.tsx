"use client";

import { useEffect, useMemo, useState } from "react";
import ClockPanel from "./sections/ClockPanel";
import CounterPanel from "./sections/CounterPanel";
import ProgressPanel from "./sections/ProgressPanel";

type Tab = "clock" | "counter" | "progress";

export default function Home() {
  const [tab, setTab] = useState<Tab>("clock");
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.6);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  function handleBackgroundChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    console.log("Background URL set:", objectUrl);
    setBackgroundUrl(objectUrl);
  }

  useEffect(() => {
    const saved = window.localStorage.getItem("clock_overlay_opacity");
    if (saved) setOverlayOpacity(Number(saved));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("clock_overlay_opacity", String(overlayOpacity));
  }, [overlayOpacity]);

  useEffect(() => {
    const saved = window.localStorage.getItem("clock_background_opacity");
    if (saved) setBackgroundOpacity(Number(saved));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("clock_background_opacity", String(backgroundOpacity));
  }, [backgroundOpacity]);

  useEffect(() => {
    const saved = window.localStorage.getItem("clock_theme");
    if (saved) setTheme(saved as "light" | "dark");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("clock_theme", theme);
  }, [theme]);

  const title = useMemo(() => {
    if (tab === "clock") return "Clock";
    if (tab === "counter") return "Counter / Timer";
    return "Progress Tracker";
  }, [tab]);

  return (
    <main className="min-h-screen text-slate-900">
      <header className="p-6 border-b bg-white/80 backdrop-blur flex flex-col gap-4 relative z-20">
        <h1 className="text-2xl font-bold">{title}</h1>

        <div className="flex gap-2">
          <button
            className={`px-3 py-2 rounded border ${
              tab === "clock" ? "bg-slate-900 text-white" : "bg-white"
            }`}
            onClick={() => setTab("clock")}
          >
            Clock
          </button>

          <button
            className={`px-3 py-2 rounded border ${
              tab === "counter" ? "bg-slate-900 text-white" : "bg-white"
            }`}
            onClick={() => setTab("counter")}
          >
            Counter
          </button>

          <button
            className={`px-3 py-2 rounded border ${
              tab === "progress" ? "bg-slate-900 text-white" : "bg-white"
            }`}
            onClick={() => setTab("progress")}
          >
            Progress
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <label className="font-medium">Background image:</label>
          <label className="px-2 py-1 text-xs rounded border bg-slate-900 text-white cursor-pointer hover:bg-slate-800 transition">
            Choose File
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundChange}
              className="hidden"
            />
          </label>
        </div>
      </header>

      <section className="p-6">
        {tab === "clock" && (
          <ClockPanel
            backgroundUrl={backgroundUrl}
            overlayOpacity={overlayOpacity}
            backgroundOpacity={backgroundOpacity}
            theme={theme}
            onOpacityChange={setOverlayOpacity}
            onBackgroundOpacityChange={setBackgroundOpacity}
            onThemeChange={setTheme}
          />
        )}
        {tab === "counter" && (
          <CounterPanel
            backgroundUrl={backgroundUrl}
            overlayOpacity={overlayOpacity}
            backgroundOpacity={backgroundOpacity}
            theme={theme}
            onOpacityChange={setOverlayOpacity}
            onBackgroundOpacityChange={setBackgroundOpacity}
            onThemeChange={setTheme}
          />
        )}
        {tab === "progress" && <ProgressPanel />}
      </section>
    </main>
  );
}