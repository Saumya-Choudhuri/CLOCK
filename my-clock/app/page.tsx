"use client";

import { useEffect, useMemo, useState } from "react";
import ClockPanel from "./sections/ClockPanel";
import CounterPanel from "./sections/CounterPanel";
import ProgressPanel from "./sections/ProgressPanel";

type Tab = "clock" | "counter" | "progress";

export default function Home() {
  const [tab, setTab] = useState<Tab>("clock");
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundType, setBackgroundType] = useState<"image" | "video" | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.6);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  function handleBackgroundChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");
    
    console.log("Background file set:", objectUrl, "Type:", isVideo ? "video" : "image");
    setBackgroundUrl(objectUrl);
    setBackgroundType(isVideo ? "video" : "image");
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
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="p-6 border-b bg-slate-900/95 backdrop-blur flex flex-col gap-4 relative z-20 border-slate-800">
        <h1 className="text-2xl font-bold text-white">{title}</h1>

        <div className="flex gap-2">
          <button
            className={`px-3 py-2 rounded border ${
              tab === "clock" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700"
            }`}
            onClick={() => setTab("clock")}
          >
            Clock
          </button>

          <button
            className={`px-3 py-2 rounded border ${
              tab === "counter" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700"
            }`}
            onClick={() => setTab("counter")}
          >
            Counter
          </button>

          <button
            className={`px-3 py-2 rounded border ${
              tab === "progress" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700"
            }`}
            onClick={() => setTab("progress")}
          >
            Progress
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <label className="font-medium">Background image:</label>
          <label className="px-2 py-1 text-xs rounded border bg-violet-600 text-white cursor-pointer hover:bg-violet-700 transition">
            Choose File
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleBackgroundChange}
              className="hidden"
            />
          </label>
        </div>
      </header>

      <section className="p-6 bg-slate-950">
        {tab === "clock" && (
          <ClockPanel
            backgroundUrl={backgroundUrl}
            backgroundType={backgroundType}
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
            backgroundType={backgroundType}
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