"use client";

import { useEffect, useRef, useState } from "react";
import ClockScreen from "../components/ClockScreen";

interface ClockPanelProps {
  backgroundUrl?: string | null;
}

export default function ClockPanel({ backgroundUrl }: ClockPanelProps) {
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.6);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const timerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseLeave = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  };

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setShowControls(true);
  };

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

  const handleFullscreen = async () => {
    if (!timerRef.current) return;

    try {
      if (!isFullscreen) {
        if (timerRef.current.requestFullscreen) {
          await timerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = () => {
      setShowControls(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [isFullscreen]);

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg overflow-hidden border relative h-[70vh]"
        ref={timerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={isFullscreen ? { height: "100vh", borderRadius: 0 } : {}}
      >
        {backgroundUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${backgroundUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: backgroundOpacity,
            }}
          />
        )}

        <div className="absolute top-4 right-4 z-10 flex flex-col gap-3 bg-white/90 backdrop-blur p-4 rounded-lg border transition-opacity duration-300" style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}>
          <div className="flex gap-2 items-center">
            {isMounted && (
              <button
                onClick={handleFullscreen}
                className={`px-2 py-1 rounded text-xs border font-medium ${
                  isFullscreen
                    ? "bg-blue-600 text-white"
                    : "bg-white border-slate-300 text-slate-700"
                }`}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? "⛶ Exit FS" : "⛶ Enter FS"}
              </button>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <label className="text-xs text-slate-700 font-medium">Theme:</label>
            <button
              onClick={() => setTheme("light")}
              className={`px-2 py-1 rounded text-xs border ${
                theme === "light"
                  ? "bg-slate-900 text-white"
                  : "bg-white border-slate-300"
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`px-2 py-1 rounded text-xs border ${
                theme === "dark"
                  ? "bg-slate-900 text-white"
                  : "bg-white border-slate-300"
              }`}
            >
              Dark
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-700 font-medium whitespace-nowrap">Brightness:</label>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              className="w-20"
            />
            <div className="text-xs font-mono tabular-nums w-7 text-right">
              {Math.round(overlayOpacity * 100)}%
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-700 font-medium whitespace-nowrap">BG Opacity:</label>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={backgroundOpacity}
              onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
              className="w-20"
            />
            <div className="text-xs font-mono tabular-nums w-7 text-right">
              {Math.round(backgroundOpacity * 100)}%
            </div>
          </div>
        </div>

        <div
          className="h-full w-full relative"
          style={{
            opacity: overlayOpacity,
          }}
        >
          <ClockScreen theme={theme} />
        </div>
      </div>
    </div>
  );
}