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
  
  // Progress tracking
  const [currentProgressTask, setCurrentProgressTask] = useState<{
    id: string;
    name: string;
  } | null>(null);

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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="p-6 border-b bg-slate-900/95 backdrop-blur flex flex-col gap-4 relative z-20 border-slate-800">
        <h1 className="text-4xl font-black text-center text-white" style={{ fontWeight: '900', opacity: '0.75' }}>THE CLOCK</h1>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              className={`px-2 py-1 text-sm rounded border ${
                tab === "clock" ? "bg-[#FFEDDF] text-slate-900" : "bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700"
              }`}
              onClick={() => setTab("clock")}
            >
              Clock
            </button>

            <button
              className={`px-2 py-1 text-sm rounded border ${
                tab === "counter" ? "bg-[#FFEDDF] text-slate-900" : "bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700"
              }`}
              onClick={() => setTab("counter")}
            >
              Counter
            </button>

            <button
              className={`px-2 py-1 text-sm rounded border ${
                tab === "progress" ? "bg-[#FFEDDF] text-slate-900" : "bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700"
              }`}
              onClick={() => setTab("progress")}
            >
              Progress
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <label className="font-medium">Background:</label>
            <label className="px-2 py-1 text-xs rounded border bg-[#FFEDDF] text-slate-900 cursor-pointer hover:bg-orange-100 transition">
              Choose File
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleBackgroundChange}
                className="hidden"
              />
            </label>
          </div>
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
            currentProgressTask={currentProgressTask}
            onTaskSessionComplete={(duration) => {
              if (currentProgressTask) {
                window.localStorage.setItem(
                  "pending_session",
                  JSON.stringify({
                    taskId: currentProgressTask.id,
                    duration,
                  })
                );
              }
            }}
            onAddNote={(note) => {
              if (currentProgressTask) {
                window.localStorage.setItem(
                  "pending_note",
                  JSON.stringify({
                    taskId: currentProgressTask.id,
                    note: {
                      id: Date.now().toString(),
                      description: note.description,
                      duration: note.duration,
                      createdAt: Date.now(),
                    },
                  })
                );
              }
            }}
          />
        )}
        {tab === "progress" && (
          <ProgressPanel
            onStartTask={(taskId, taskName) => {
              setCurrentProgressTask({ id: taskId, name: taskName });
              setTab("counter");
            }}
            onTaskSessionComplete={(taskId, duration) => {
              // This will be called when counter session completes
            }}
            onAddTaskNote={(taskId, note) => {
              // Note has been added to the task
              console.log("Note added to task:", taskId, note);
            }}
            currentProgressTask={currentProgressTask}
            onClearCurrentTask={() => setCurrentProgressTask(null)}
          />
        )}
      </section>
    </main>
  );
}