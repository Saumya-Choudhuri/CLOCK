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
        <div className="banner-shell relative z-50">
          <header className="premium-header relative z-50 overflow-visible">
            <div className="app-shell py-10 md:py-12 flex flex-col gap-6">
              <div className="flex flex-wrap items-start gap-6">
                <div className="flex items-center gap-4 animate-rise stagger-1">
                  <div className="h-12 w-12 rounded-[16px] bg-[color:var(--foreground)] text-[color:var(--accent)] shadow-[0_10px_26px_rgba(13,15,18,0.25)] flex items-center justify-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[0.65rem] uppercase tracking-[0.4em] text-[color:var(--muted)]">
                      Precision Studio
                    </p>
                    <h1 className="text-3xl md:text-4xl font-display title-glow">The Clock</h1>
                    <p className="text-sm text-[color:var(--muted)]">
                      Time, tasks, and focus in one calm system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="app-shell pb-2 relative z-40 banner-reveal">
            <div className="panel-surface px-4 py-3 md:px-6 md:py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-rise stagger-3">
              <nav className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="tab-pill"
                  data-active={tab === "clock"}
                  onClick={() => setTab("clock")}
                >
                  Clock
                </button>

                <button
                  type="button"
                  className="tab-pill"
                  data-active={tab === "counter"}
                  onClick={() => setTab("counter")}
                >
                  Counter
                </button>

                <button
                  type="button"
                  className="tab-pill"
                  data-active={tab === "tasks"}
                  onClick={() => setTab("tasks")}
                >
                  Tasks
                </button>

                <button
                  type="button"
                  className="tab-pill"
                  data-active={tab === "analytics"}
                  onClick={() => setTab("analytics")}
                >
                  Analytics
                </button>
              </nav>

              <div className="flex items-center justify-start md:justify-end">
                <UserHeader />
              </div>
            </div>
          </section>
        </div>

        <section className="app-shell pb-10 relative z-10">
          <div className="mt-6 md:mt-8">
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