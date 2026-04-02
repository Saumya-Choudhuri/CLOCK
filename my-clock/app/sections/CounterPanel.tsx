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
  backgroundType?: "image" | "video" | null;
  overlayOpacity?: number;
  backgroundOpacity?: number;
  theme?: "light" | "dark";
  onOpacityChange?: (opacity: number) => void;
  onBackgroundOpacityChange?: (opacity: number) => void;
  onThemeChange?: (theme: "light" | "dark") => void;
  currentProgressTask?: { id: string; name: string } | null;
  onTaskSessionComplete?: (duration: number) => void;
  onAddNote?: (note: { description: string; duration: number }) => void;
}

export default function CounterPanel({
  backgroundUrl,
  backgroundType,
  overlayOpacity = 0.6,
  backgroundOpacity = 0.6,
  theme = "light",
  onOpacityChange,
  onBackgroundOpacityChange,
  onThemeChange,
  currentProgressTask,
  onTaskSessionComplete,
  onAddNote,
}: CounterPanelProps) {
  const [preCount, setPreCount] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteDescription, setNoteDescription] = useState("");
  const [noteDuration, setNoteDuration] = useState<number>(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTsRef = useRef<number | null>(null);
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

  const clearTick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const stop = () => {
    setRunning(false);
    clearTick();
    startTsRef.current = null;
    
    // Save session to progress if tracking a task
    if (currentProgressTask && elapsedMs > 0 && onTaskSessionComplete) {
      onTaskSessionComplete(elapsedMs);
    }
  };

  const reset = () => {
    stop();
    setElapsedMs(0);
    setPreCount(null);
  };

  const handleAddNote = () => {
    if (noteDescription.trim() && onAddNote) {
      onAddNote({
        description: noteDescription,
        duration: noteDuration,
      });
      setNoteDescription("");
      setNoteDuration(0);
      setShowNoteModal(false);
    }
  };

  const handleNoteModalOpenAndSetDefault = () => {
    // Set duration to current elapsed time by default
    setNoteDuration(elapsedMs);
    setShowNoteModal(true);
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
                    ? "bg-[#FFEDDF] text-slate-900"
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
                  ? "bg-[#FFEDDF] text-slate-900"
                  : "bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
              }`}
            >
              Light
            </button>
            <button
              onClick={() => onThemeChange?.("dark")}
              className={`px-2 py-1 rounded text-xs border ${
                theme === "dark"
                  ? "bg-[#FFEDDF] text-slate-900"
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
              className="w-20 accent-[#FFEDDF]"
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
              className="w-20 accent-[#FFEDDF]"
            />
            <div className="text-xs font-mono tabular-nums w-7 text-right text-slate-300">
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
            {currentProgressTask && (
              <div className="text-sm text-slate-300 mb-4">
                Tracking: <span className="text-white font-semibold">{currentProgressTask.name}</span>
              </div>
            )}
            
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

              <button className="px-6 py-3 rounded border bg-red-600/60 border-red-500 text-white font-medium hover:bg-red-600/80 transition" onClick={reset}>
                Reset
              </button>

              {currentProgressTask && (
                <button 
                  className="px-6 py-3 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                  onClick={handleNoteModalOpenAndSetDefault}
                >
                  Note
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-white">Add a Note</h2>
            
            <div className="space-y-2">
              <label className="block text-sm text-slate-300">Note Description</label>
              <input
                type="text"
                placeholder="e.g., Worked on feature X, Attended meeting"
                value={noteDescription}
                onChange={(e) => setNoteDescription(e.target.value)}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white placeholder-slate-500 border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-slate-300">Time Spent (from counter)</label>
              <div className="flex gap-2 items-center px-3 py-2 rounded bg-slate-700 border border-slate-600">
                <span className="text-lg font-mono text-white">{formatMs(elapsedMs)}</span>
              </div>
              <p className="text-xs text-slate-400">
                This time will be recorded with your note
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 px-4 py-2 rounded bg-slate-700 text-white hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!noteDescription.trim()}
                className="flex-1 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}