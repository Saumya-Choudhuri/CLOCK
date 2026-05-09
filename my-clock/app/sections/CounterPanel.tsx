"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { getProgressDiagnostics } from "../utils/progressDiagnostics";

type ClockFont = "display" | "grotesk" | "sora" | "mono";

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

interface TaskSession {
  startTime: number;
  endTime: number | null;
  duration: number;
}

interface TaskNote {
  id: string;
  description: string;
  duration: number;
  createdAt: number;
}

interface Task {
  id: string;
  name: string;
  sessions: TaskSession[];
  notes: TaskNote[];
  isRunning: boolean;
  currentSessionStart: number | null;
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
  clockFont?: ClockFont;
  onClockFontChange?: (font: ClockFont) => void;
  onBackgroundChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  currentProgressTask?: { id: string; name: string } | null;
  onTaskSessionComplete?: (duration: number) => void;
  isActive?: boolean;
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
  clockFont = "display",
  onClockFontChange,
  onBackgroundChange,
  currentProgressTask,
  onTaskSessionComplete,
  isActive = true,
}: CounterPanelProps) {
  const [preCount, setPreCount] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteDescription, setNoteDescription] = useState("");
  const [wasRunningBeforeNote, setWasRunningBeforeNote] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTsRef = useRef<number | null>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasRunningBeforeSwitchRef = useRef(false);
  const diagnosticsRef = useRef<string>("");

  // Declare functions before useEffect
  const clearTick = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const saveProgressData = useCallback((updatedTasks: Task[]) => {
    try {
      const existing = window.localStorage.getItem("progress_data");
      const parsed = existing ? JSON.parse(existing) : null;
      const payload = parsed && typeof parsed === "object"
        ? { ...parsed, tasks: updatedTasks }
        : { tasks: updatedTasks };
      window.localStorage.setItem("progress_data", JSON.stringify(payload));
    } catch (error) {
      console.error("Failed to save progress data:", error);
      window.localStorage.setItem(
        "progress_data",
        JSON.stringify({ tasks: updatedTasks })
      );
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    
    // Load counter state from localStorage on mount
    const saved = window.localStorage.getItem("counter_state");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setElapsedMs(data.elapsedMs || 0);
        wasRunningBeforeSwitchRef.current = data.wasRunning || false;
      } catch (e) {
        console.error("Failed to load counter state", e);
      }
    }
  }, []);

  // Load and poll tasks
  useEffect(() => {
    let lastDataStr = "";

    const loadTasks = () => {
      const taskData = window.localStorage.getItem("progress_data");
      if (!taskData) {
        if (lastDataStr !== "") {
          lastDataStr = "";
          setTasks([]);
          setSelectedTaskId("");
        }
        return;
      }

      // Only update if data has actually changed
      if (taskData !== lastDataStr) {
        lastDataStr = taskData;
        try {
          const data = JSON.parse(taskData);
          const loadedTasks: Task[] = (data.tasks || []).map((task: Task) => ({
            ...task,
            sessions: task.sessions || [],
            notes: task.notes || [],
          }));
          setTasks(loadedTasks);
          
          // Ensure a task is selected
          if (loadedTasks.length > 0) {
            setSelectedTaskId((prevId) => {
              if (prevId && loadedTasks.some((task: Task) => task.id === prevId)) {
                return prevId;
              }
              return loadedTasks[0].id;
            });
          } else {
            setSelectedTaskId("");
          }
        } catch (e) {
          console.error("Failed to load tasks", e);
          lastDataStr = "";
          setTasks([]);
          setSelectedTaskId("");
        }
      }
    };

    loadTasks();

    // Poll for task updates from other sections (less frequently)
    const interval = setInterval(loadTasks, 1000);

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "progress_data") {
        loadTasks();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Save counter state to localStorage
  useEffect(() => {
    if (isMounted) {
      window.localStorage.setItem(
        "counter_state",
        JSON.stringify({
          elapsedMs,
          wasRunning: wasRunningBeforeSwitchRef.current || running,
        })
      );
    }
  }, [elapsedMs, running, isMounted]);

  // Handle pause when switching tabs
  useEffect(() => {
    if (!isActive && running) {
      wasRunningBeforeSwitchRef.current = true;
      clearTick();
      setRunning(false);
    }
  }, [isActive, running, clearTick]);

  useEffect(() => {
    const diagnostics = getProgressDiagnostics(tasks);
    if (diagnostics.length === 0) {
      diagnosticsRef.current = "";
      return;
    }

    const signature = diagnostics.map((issue) => issue.code).join("|");
    if (signature === diagnosticsRef.current) return;
    diagnosticsRef.current = signature;
    console.warn("[CounterPanel] Progress data diagnostics", diagnostics);
  }, [tasks]);

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



  const stop = () => {
    setRunning(false);
    clearTick();
    startTsRef.current = null;
    
    // Save session to the selected task if time elapsed
    if (selectedTaskId && elapsedMs > 0) {
      const updatedTasks = tasks.map((task) => {
        if (task.id === selectedTaskId) {
          return {
            ...task,
            sessions: [
              ...task.sessions,
              {
                startTime: Date.now() - elapsedMs,
                endTime: Date.now(),
                duration: elapsedMs,
              },
            ],
          };
        }
        return task;
      });
      
      setTasks(updatedTasks);
      
      saveProgressData(updatedTasks);

      // Reset the timer for next session
      setElapsedMs(0);
    }
    
    // Call callback if tracking a task via prop
    if (currentProgressTask && elapsedMs > 0 && onTaskSessionComplete) {
      onTaskSessionComplete(elapsedMs);
    }
  };

  const reset = () => {
    stop();
    setElapsedMs(0);
    setPreCount(null);
    // Clear counter state from localStorage on reset
    window.localStorage.removeItem("counter_state");
  };

  const handleAddNote = () => {
    if (noteDescription.trim() && selectedTaskId) {
      // Add note to the selected task using the current elapsed time
      const updatedTasks = tasks.map((task) => {
        if (task.id === selectedTaskId) {
          return {
            ...task,
            notes: [
              ...task.notes,
              {
                id: Date.now().toString(),
                description: noteDescription,
                duration: elapsedMs,
                createdAt: Date.now(),
              },
            ],
          };
        }
        return task;
      });
      
      setTasks(updatedTasks);
      
      saveProgressData(updatedTasks);
      
      setNoteDescription("");
      setShowNoteModal(false);
      // Resume timer if it was running before
      if (wasRunningBeforeNote) {
        setRunning(true);
        startTsRef.current = Date.now() - elapsedMs;
        clearTick();
        intervalRef.current = setInterval(() => {
          if (startTsRef.current == null) return;
          setElapsedMs(Date.now() - startTsRef.current);
        }, 250);
      }
    }
  };

  const handleNoteModalOpenAndSetDefault = () => {
    // Pause timer if it's running
    setWasRunningBeforeNote(running);
    if (running) {
      clearTick();
      setRunning(false);
    }
    setShowNoteModal(true);
  };

  const handleNoteModalClose = () => {
    setShowNoteModal(false);
    setNoteDescription("");
    // Resume timer if it was running before
    if (wasRunningBeforeNote) {
      setRunning(true);
      startTsRef.current = Date.now() - elapsedMs;
      clearTick();
      intervalRef.current = setInterval(() => {
        if (startTsRef.current == null) return;
        setElapsedMs(Date.now() - startTsRef.current);
      }, 250);
    }
  };

  const startTimerNow = useCallback(() => {
    setRunning(true);
    startTsRef.current = Date.now() - elapsedMs;

    clearTick();
    intervalRef.current = setInterval(() => {
      if (startTsRef.current == null) return;
      setElapsedMs(Date.now() - startTsRef.current);
    }, 250);
  }, [elapsedMs, clearTick]);

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
  }, [preCount, startTimerNow]);

  useEffect(() => {
    return () => clearTick();
  }, []);

  return (
    <div className="space-y-4">
      <div
        className="premium-panel premium-frame h-[70vh]"
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
            {isMounted && (
              <button
                onClick={handleFullscreen}
                className={`btn px-3 py-1.5 text-xs ${
                  isFullscreen ? "btn-primary" : "btn-ghost"
                }`}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? "⛶ Exit FS" : "⛶ Enter FS"}
              </button>
            )}
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
              Clock Font:
            </label>
            <select
              value={clockFont}
              onChange={(e) => onClockFontChange?.(e.target.value as ClockFont)}
              className="select-premium w-auto text-xs"
            >
              <option value="display">Cormorant</option>
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
          className="h-full w-full relative flex flex-col items-center justify-center"
          style={{
            opacity: overlayOpacity,
          }}
        >
          <div className="text-center">
            {tasks.length === 0 ? (
              <div className="text-sm text-[color:var(--muted)] mb-4">
                No tasks. Create one in the Tasks section.
              </div>
            ) : (
              <div className="mb-4">
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="select-premium w-auto text-sm cursor-pointer"
                  style={{ color: theme === "light" ? "#ffffff" : "#0f172a" }}
                >
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id} style={{ color: "#000" }}>
                      {task.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentProgressTask && (
              <div className="text-sm text-[color:var(--muted)] mb-2">
                Legacy: <span className="text-white font-semibold">{currentProgressTask.name}</span>
              </div>
            )}
            
            {preCount != null ? (
              <div className="text-7xl md:text-8xl clock-font font-semibold time-glow" style={{ color: theme === "light" ? "#ffffff" : "#0f172a" }}>
                {preCount}
              </div>
            ) : (
              <div className="text-7xl md:text-8xl clock-font font-semibold tabular-nums time-glow" style={{ color: theme === "light" ? "#ffffff" : "#0f172a" }}>
                {formatMs(elapsedMs)}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-4 justify-center transition-opacity duration-300" style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}>
              {!running ? (
                <button
                  className="btn btn-primary px-6 py-3 text-sm"
                  onClick={startWithCountdown}
                >
                  Start
                </button>
              ) : (
                <button
                  className="btn btn-danger px-6 py-3 text-sm"
                  onClick={stop}
                >
                  Stop
                </button>
              )}

              <button className="btn btn-outline px-6 py-3 text-sm" onClick={reset}>
                Reset
              </button>

              {selectedTaskId && tasks.length > 0 && (
                <button 
                  className="btn btn-ghost px-6 py-3 text-sm"
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="panel-surface p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-white">Add a Note</h2>
            
            {tasks.length === 0 ? (
              <div className="card-surface p-3 text-sm text-[color:var(--muted)]">
                No tasks available. Create a task in the Tasks section first.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm text-[color:var(--muted)]">Select Task</label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="select-premium w-full"
                  >
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-[color:var(--muted)]">Note Description</label>
                  <input
                    type="text"
                    placeholder="e.g., Worked on feature X, Attended meeting"
                    value={noteDescription}
                    onChange={(e) => setNoteDescription(e.target.value)}
                    className="input-premium w-full"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-[color:var(--muted)]">Time Spent (from counter)</label>
                  <div className="flex gap-2 items-center px-3 py-2 rounded bg-[rgba(10,15,24,0.7)] border border-[rgba(217,180,111,0.25)]">
                    <span className="text-lg clock-font tabular-nums text-white">{formatMs(elapsedMs)}</span>
                  </div>
                  <p className="text-xs text-[color:var(--muted)]">
                    Timer is paused while adding a note
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleNoteModalClose}
                    className="btn btn-muted flex-1 px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    disabled={!noteDescription.trim() || !selectedTaskId}
                    className="btn btn-primary flex-1 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Note
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}