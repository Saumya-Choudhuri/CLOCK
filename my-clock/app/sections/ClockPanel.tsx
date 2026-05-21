"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import ClockScreen from "../components/ClockScreen";

type ClockFont = "display" | "grotesk" | "sora" | "mono";

interface ClockPanelProps {
  backgroundUrl?: string | null;
  backgroundType?: "image" | "video" | null;
  overlayOpacity?: number;
  backgroundOpacity?: number;
  theme?: "light" | "dark";
  onOpacityChange?: (opacity: number) => void;
  onBackgroundOpacityChange?: (opacity: number) => void;
  onThemeChange?: (theme: "light" | "dark") => void;
  clockFont?: ClockFont;
  onClockFontChange?: (font: ClockFont) => void;
  onBackgroundChange?: (event: ChangeEvent<HTMLInputElement>) => void;
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
  clockFont = "display",
  onClockFontChange,
  onBackgroundChange,
}: ClockPanelProps) {

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const timerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        className="premium-panel premium-frame clock-stage h-[70vh]"
        data-theme={theme}
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

        <div
          className="absolute top-4 right-4 z-10 flex flex-col gap-3 floating-controls p-4 transition-opacity duration-300"
          style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}
        >
          <div className="flex gap-2 items-center">
            <button
              onClick={handleFullscreen}
              className={`btn px-3 py-1.5 text-xs ${
                isFullscreen ? "btn-primary" : "btn-ghost"
              }`}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? "⛶ Exit FS" : "⛶ Enter FS"}
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <label className="text-xs text-[color:var(--muted)] font-medium">Theme:</label>
            <button
              onClick={() => onThemeChange?.("light")}
              className={`btn px-3 py-1.5 text-xs ${
                theme === "light" ? "btn-primary" : "btn-ghost"
              }`}
            >
              Light
            </button>
            <button
              onClick={() => onThemeChange?.("dark")}
              className={`btn px-3 py-1.5 text-xs ${
                theme === "dark" ? "btn-primary" : "btn-ghost"
              }`}
            >
              Dark
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-[color:var(--muted)] font-medium whitespace-nowrap">
              Typeface:
            </label>
            <select
              value={clockFont}
              onChange={(e) => onClockFontChange?.(e.target.value as ClockFont)}
              className="select-premium w-auto text-xs"
            >
              <option value="display">Syne</option>
              <option value="grotesk">Space Grotesk</option>
              <option value="sora">Sora</option>
              <option value="mono">JetBrains Mono</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-[color:var(--muted)] font-medium whitespace-nowrap">Brightness:</label>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={overlayOpacity}
              onChange={(e) => onOpacityChange?.(Number(e.target.value))}
              className="w-24 range-premium"
            />
            <div className="text-xs font-mono tabular-nums w-7 text-right text-[color:var(--muted)]">
              {Math.round(overlayOpacity * 100)}%
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-[color:var(--muted)] font-medium whitespace-nowrap">BG Opacity:</label>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={backgroundOpacity}
              onChange={(e) => onBackgroundOpacityChange?.(Number(e.target.value))}
              className="w-24 range-premium"
            />
            <div className="text-xs font-mono tabular-nums w-7 text-right text-[color:var(--muted)]">
              {Math.round(backgroundOpacity * 100)}%
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-[color:var(--muted)] font-medium whitespace-nowrap">
              Background:
            </label>
            <label className="btn btn-outline px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] cursor-pointer">
              Choose
              <input
                type="file"
                accept="image/*,video/*"
                onChange={onBackgroundChange}
                className="hidden"
              />
            </label>
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