"use client";

import { useEffect, useRef, useState } from "react";
import ClockScreen from "../components/ClockScreen";

interface ClockPanelProps {
  backgroundUrl?: string | null;
  backgroundType?: "image" | "video" | null;
  overlayOpacity?: number;
  backgroundOpacity?: number;
  theme?: "light" | "dark";
  onOpacityChange?: (opacity: number) => void;
  onBackgroundOpacityChange?: (opacity: number) => void;
  onThemeChange?: (theme: "light" | "dark") => void;
}

export default function ClockPanel({
  backgroundUrl,
  backgroundType,
  overlayOpacity = 0.6,
  backgroundOpacity = 0.6,
  theme = "light",
  onOpacityChange,
  onBackgroundOpacityChange,
  onThemeChange,
}: ClockPanelProps) {

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const timerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
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
    document.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("mousemove", handleMouseMove);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg overflow-hidden border border-slate-700 relative h-[70vh] bg-slate-900"
        ref={timerRef}
        style={isFullscreen ? { height: "100vh", borderRadius: 0 } : {}}
      >
        {backgroundUrl && backgroundType === "image" && (
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

        {backgroundUrl && backgroundType === "video" && (
          <video
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: backgroundOpacity,
            }}
            autoPlay
            loop
            muted
          >
            <source src={backgroundUrl} type="video/mp4" />
            <source src={backgroundUrl} type="video/webm" />
            <source src={backgroundUrl} type="video/ogg" />
          </video>
        )}

        <div className="absolute top-4 right-4 z-10 flex flex-col gap-3 bg-slate-800/95 backdrop-blur p-4 rounded-lg border border-slate-700 transition-opacity duration-300" style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}>
          <div className="flex gap-2 items-center">
            {isMounted && (
              <button
                onClick={handleFullscreen}
                className={`px-2 py-1 rounded text-xs border font-medium ${
                  isFullscreen
                    ? "bg-violet-600 text-white"
                    : "bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
                }`}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? "⛶ Exit FS" : "⛶ Enter FS"}
              </button>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <label className="text-xs text-slate-300 font-medium">Theme:</label>
            <button
              onClick={() => onThemeChange?.("light")}
              className={`px-2 py-1 rounded text-xs border ${
                theme === "light"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
              }`}
            >
              Light
            </button>
            <button
              onClick={() => onThemeChange?.("dark")}
              className={`px-2 py-1 rounded text-xs border ${
                theme === "dark"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
              }`}
            >
              Dark
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-300 font-medium whitespace-nowrap">Brightness:</label>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={overlayOpacity}
              onChange={(e) => onOpacityChange?.(Number(e.target.value))}
              className="w-20 accent-violet-600"
            />
            <div className="text-xs font-mono tabular-nums w-7 text-right text-slate-300">
              {Math.round(overlayOpacity * 100)}%
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-300 font-medium whitespace-nowrap">BG Opacity:</label>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={backgroundOpacity}
              onChange={(e) => onBackgroundOpacityChange?.(Number(e.target.value))}
              className="w-20 accent-violet-600"
            />
            <div className="text-xs font-mono tabular-nums w-7 text-right text-slate-300">
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