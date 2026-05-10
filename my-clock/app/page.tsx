"use client";

import { useEffect, useState } from "react";
import ClockPanel from "./sections/ClockPanel";
import CounterPanel from "./sections/CounterPanel";
import AnalyticsPanel from "./sections/AnalyticsPanel";
import TasksPanel from "./sections/TasksPanel";
import { UserHeader } from "./components/UserHeader";

type Tab = "clock" | "counter" | "analytics" | "tasks";
type ClockFont = "display" | "grotesk" | "sora" | "mono";

export default function Home() {
  const [tab, setTab] = useState<Tab>("clock");
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundType, setBackgroundType] = useState<"image" | "video" | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.6);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [clockFont, setClockFont] = useState<ClockFont>("display");
  
  // Progress tracking
  const [currentProgressTask] = useState<{
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
    try {
      const saved = window.localStorage.getItem("clock_overlay_opacity");
      if (saved) {
        setOverlayOpacity(Number(saved));
      }
    } catch (error) {
      console.error("Failed to load overlay opacity:", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("clock_overlay_opacity", String(overlayOpacity));
    } catch (error) {
      console.error("Failed to save overlay opacity:", error);
    }
  }, [overlayOpacity]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("clock_background_opacity");
      if (saved) {
        setBackgroundOpacity(Number(saved));
      }
    } catch (error) {
      console.error("Failed to load background opacity:", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("clock_background_opacity", String(backgroundOpacity));
    } catch (error) {
      console.error("Failed to save background opacity:", error);
    }
  }, [backgroundOpacity]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("clock_theme");
      if (saved) {
        setTheme(saved as "light" | "dark");
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("clock_theme", theme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  }, [theme]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("clock_font");
      if (saved) {
        setClockFont(saved as ClockFont);
      }
    } catch (error) {
      console.error("Failed to load clock font:", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("clock_font", clockFont);
    } catch (error) {
      console.error("Failed to save clock font:", error);
    }
  }, [clockFont]);

  return (
    <main
      className="min-h-screen premium-bg text-[color:var(--foreground)]"
      data-clock-font={clockFont}
    >
      <div className="ambient-orbs" aria-hidden="true" />
      <div className="relative z-10">
        <header className="premium-header relative z-50 overflow-visible">
          <div className="app-shell py-10 md:py-14 flex flex-col gap-6">
            <div className="relative flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[color:var(--accent-strong)] to-[color:var(--accent-2)] shadow-lg" />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Chrono Suite</p>
                  <h1 className="text-2xl md:text-3xl font-display title-glow">The Clock</h1>
                </div>
              </div>

              <div className="ml-auto flex items-center">
                <UserHeader />
              </div>

              <nav className="flex w-full flex-wrap items-center justify-center gap-6 md:absolute md:left-1/2 md:w-auto md:-translate-x-1/2">
                <button
                  type="button"
                  className="nav-link"
                  data-active={tab === "clock"}
                  onClick={() => setTab("clock")}
                >
                  Clock
                </button>

                <button
                  type="button"
                  className="nav-link"
                  data-active={tab === "counter"}
                  onClick={() => setTab("counter")}
                >
                  Counter
                </button>

                <button
                  type="button"
                  className="nav-link"
                  data-active={tab === "tasks"}
                  onClick={() => setTab("tasks")}
                >
                  Tasks
                </button>

                <button
                  type="button"
                  className="nav-link"
                  data-active={tab === "analytics"}
                  onClick={() => setTab("analytics")}
                >
                  Analytics
                </button>
              </nav>
            </div>
          </div>
        </header>

        <section className="app-shell pb-10">
          <div className="mt-10 md:mt-14">
            {tab === "clock" && (
              <div className="animate-fade">
                <ClockPanel
                  backgroundUrl={backgroundUrl}
                  backgroundType={backgroundType}
                  overlayOpacity={overlayOpacity}
                  backgroundOpacity={backgroundOpacity}
                  theme={theme}
                  onOpacityChange={setOverlayOpacity}
                  onBackgroundOpacityChange={setBackgroundOpacity}
                  onThemeChange={setTheme}
                  clockFont={clockFont}
                  onClockFontChange={setClockFont}
                  onBackgroundChange={handleBackgroundChange}
                />
              </div>
            )}
            {tab === "counter" && (
              <div className="animate-fade">
                <CounterPanel
                  backgroundUrl={backgroundUrl}
                  backgroundType={backgroundType}
                  overlayOpacity={overlayOpacity}
                  backgroundOpacity={backgroundOpacity}
                  theme={theme}
                  onOpacityChange={setOverlayOpacity}
                  onBackgroundOpacityChange={setBackgroundOpacity}
                  onThemeChange={setTheme}
                  clockFont={clockFont}
                  onClockFontChange={setClockFont}
                  onBackgroundChange={handleBackgroundChange}
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
                  isActive={tab === "counter"}
                />
              </div>
            )}
            {tab === "analytics" && (
              <div className="animate-fade">
                <AnalyticsPanel />
              </div>
            )}
            {tab === "tasks" && (
              <div className="animate-fade">
                <TasksPanel />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}