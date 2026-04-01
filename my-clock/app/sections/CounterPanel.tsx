"use client";

import { useEffect, useRef, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatMs(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

interface CounterPanelProps {
  backgroundUrl?: string | null;
  overlayOpacity?: number;
  backgroundOpacity?: number;
  theme?: "light" | "dark";
  onOpacityChange?: (opacity: number) => void;
  onBackgroundOpacityChange?: (opacity: number) => void;
  onThemeChange?: (theme: "light" | "dark") => void;
}

export default function CounterPanel({
  backgroundUrl,
  overlayOpacity = 0.6,
  backgroundOpacity = 0.6,
  theme = "light",
  onOpacityChange,
  onBackgroundOpacityChange,
  onThemeChange,
}: CounterPanelProps) {
  const [preCount, setPreCount] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTsRef = useRef<number | null>(null);
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

  const clearTick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const stop = () => {
    setRunning(false);
    clearTick();
    startTsRef.current = null;
  };

  const reset = () => {
    stop();
    setElapsedMs(0);
    setPreCount(null);
  };

  const startTimerNow = () => {
    setRunning(true);
    startTsRef.current = Date.now() - elapsedMs;

    clearTick();
    intervalRef.current = setInterval(() => {
      if (startTsRef.current == null) return;
      setElapsedMs(Date.now() - startTsRef.current);
    }, 250);
  };

  const startWithCountdown = () => {
    if (running || preCount !== null) return;
    setPreCount(3);
  };

  useEffect(() => {
    if (preCount == null) return;

    if (preCount === 0) {
      setPreCount(null);
      startTimerNow();
      return;
    }

    const t = setTimeout(
      () => setPreCount((x) => (x == null ? null : x - 1)),
      1000
    );
    return () => clearTimeout(t);
  }, [preCount]);

  useEffect(() => {
    return () => clearTick();
  }, []);

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
              onClick={() => onThemeChange?.("light")}
              className={`px-2 py-1 rounded text-xs border ${
                theme === "light"
                  ? "bg-slate-900 text-white"
                  : "bg-white border-slate-300"
              }`}
            >
              Light
            </button>
            <button
              onClick={() => onThemeChange?.("dark")}
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
              onChange={(e) => onOpacityChange?.(Number(e.target.value))}
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
              onChange={(e) => onBackgroundOpacityChange?.(Number(e.target.value))}
              className="w-20"
            />
            <div className="text-xs font-mono tabular-nums w-7 text-right">
              {Math.round(backgroundOpacity * 100)}%
            </div>
          </div>
        </div>

        <div
          className="h-full w-full relative flex flex-col items-center justify-center"
          style={{
            opacity: overlayOpacity,
          }}
        >
          <div className="text-center">
            {preCount != null ? (
              <div className="text-7xl font-bold" style={{ color: theme === "light" ? "#ffffff" : "#0f172a" }}>
                {preCount}
              </div>
            ) : (
              <div className="text-7xl font-bold tabular-nums" style={{ color: theme === "light" ? "#ffffff" : "#0f172a" }}>
                {formatMs(elapsedMs)}
              </div>
            )}

            <div className="mt-8 flex gap-4 justify-center transition-opacity duration-300" style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}>
              {!running ? (
                <button
                  className="px-6 py-3 rounded bg-slate-900 text-white font-medium"
                  onClick={startWithCountdown}
                >
                  Start
                </button>
              ) : (
                <button
                  className="px-6 py-3 rounded bg-red-600 text-white font-medium"
                  onClick={stop}
                >
                  Stop
                </button>
              )}

              <button className="px-6 py-3 rounded border bg-white font-medium" onClick={reset}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}