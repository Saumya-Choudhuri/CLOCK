"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { getProgressDiagnostics } from "../utils/progressDiagnostics";
import { useAuth } from "../context/AuthContext";
import { readProgressData } from "../utils/progressStorage";

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

export default function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const diagnosticsRef = useRef<string>("");
  const { user, userData, checkFreeTrial, checkPremiumAccess } = useAuth();
  const [guestTrialStart, setGuestTrialStart] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const progressKey = user?.uid ?? userData?.uid ?? null;

  const TRIAL_DAYS = 7;
  const TRIAL_TASK_LIMIT = 3;
  const TRIAL_NOTE_LIMIT = 3;

  const DAY_MS = 1000 * 60 * 60 * 24;

  const saveProgressData = useCallback((updatedTasks: Task[]) => {
    try {
      const { key, stored } = readProgressData(progressKey);
      const existing = stored;
      const parsed = existing ? JSON.parse(existing) : null;
      const payload = parsed && typeof parsed === "object"
        ? { ...parsed, tasks: updatedTasks }
        : { tasks: updatedTasks };
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
      console.error("Failed to save progress data:", error);
      window.localStorage.setItem(
        `progress_data_${progressKey ?? "guest"}`,
        JSON.stringify({ tasks: updatedTasks })
      );
    }
  }, [progressKey]);

  // Load from localStorage
  useEffect(() => {
    let lastDataStr = "";

    const loadTasks = () => {
      const { stored } = readProgressData(progressKey);
      const saved = stored;
      if (!saved) {
        if (lastDataStr !== "") {
          lastDataStr = "";
          setTasks([]);
        }
        return;
      }

      try {
        // Only update if data has actually changed
        if (saved !== lastDataStr) {
          lastDataStr = saved;
          const data = JSON.parse(saved);
          const migratedTasks = (data.tasks || []).map((task: Task) => ({
            ...task,
            sessions: task.sessions || [],
            notes: task.notes || [],
          }));
          setTasks(migratedTasks);
        }
      } catch (error) {
        console.error("Failed to load progress data:", error);
        if (progressKey) {
          window.localStorage.removeItem(`progress_data_${progressKey}`);
        } else {
          window.localStorage.removeItem("progress_data_guest");
        }
        lastDataStr = "";
        setTasks([]);
      }
    };

    loadTasks();
    setHasLoaded(true);

    // Poll localStorage for changes from other sections (less frequently)
    const interval = setInterval(() => {
      loadTasks();
    }, 1000);

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `progress_data_${progressKey ?? "guest"}`) {
        loadTasks();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [progressKey]);

  useEffect(() => {
    if (userData) return;
    try {
      const stored = window.localStorage.getItem("guest_trial_start");
      if (stored) {
        setGuestTrialStart(Number(stored));
        return;
      }

      const now = Date.now();
      window.localStorage.setItem("guest_trial_start", String(now));
      setGuestTrialStart(now);
    } catch (error) {
      console.error("Failed to initialize guest trial:", error);
    }
  }, [userData]);

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    if (!hasLoaded) return;
    saveProgressData(tasks);
  }, [tasks, hasLoaded, saveProgressData]);

  useEffect(() => {
    const diagnostics = getProgressDiagnostics(tasks);
    if (diagnostics.length === 0) {
      diagnosticsRef.current = "";
      return;
    }

    const signature = diagnostics.map((issue) => issue.code).join("|");
    if (signature === diagnosticsRef.current) return;
    diagnosticsRef.current = signature;
    console.warn("[TasksPanel] Progress data diagnostics", diagnostics);
  }, [tasks]);

  useEffect(() => {
    if (expandedTaskId && !tasks.some((task) => task.id === expandedTaskId)) {
      setExpandedTaskId(null);
    }
  }, [expandedTaskId, tasks]);

  // Calculate total duration for a task (including both sessions and notes)
  const calculateTaskDuration = (task: Task): number => {
    const sessionDuration = task.sessions.reduce((sum, session) => sum + session.duration, 0);
    const notesDuration = task.notes.reduce((sum, note) => sum + note.duration, 0);
    return sessionDuration + notesDuration;
  };

  const calculateNotesDuration = (task: Task): number => {
    return task.notes.reduce((sum, note) => sum + note.duration, 0);
  };

  const trialStart = userData?.signupDate ?? guestTrialStart;
  const nowValue = now ?? 0;
  const trialDaysRemaining = trialStart && nowValue
    ? Math.max(
        0,
        TRIAL_DAYS -
          Math.floor((nowValue - trialStart) / DAY_MS)
      )
    : TRIAL_DAYS;
  const isTrialActive = userData ? checkFreeTrial() : trialDaysRemaining > 0;
  const premiumUntil = userData?.premiumUntil;
  const isPremiumActive = checkPremiumAccess();
  const premiumDaysRemaining = premiumUntil && nowValue
    ? Math.max(0, Math.ceil((premiumUntil - nowValue) / DAY_MS))
    : 0;
  const canAddTask = isPremiumActive || (isTrialActive && tasks.length < TRIAL_TASK_LIMIT);
  const statusMessage = isPremiumActive
    ? `Monthly Premium active • ${premiumDaysRemaining} days left`
    : isTrialActive
      ? `Free trial: ${trialDaysRemaining} days left • ${TRIAL_TASK_LIMIT} tasks max • ${TRIAL_NOTE_LIMIT} notes per task`
      : "Trial ended • Upgrade to Monthly Premium for unlimited tasks";
  const showUpgradeBanner =
    !isPremiumActive && (!isTrialActive || tasks.length >= TRIAL_TASK_LIMIT);

  const handleAddTask = () => {
    if (!canAddTask) return;
    const name = newTaskName.trim();
    if (!name) return;
    const newTask: Task = {
      id: Date.now().toString(),
      name,
      sessions: [],
      notes: [],
      isRunning: false,
      currentSessionStart: null,
    };
    setTasks([...tasks, newTask]);
    setNewTaskName("");
  };

  const handleNewTaskKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddTask();
    }
  };

  // Format milliseconds to hours and minutes
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Delete a note from a task
  const handleDeleteNote = (taskId: string, noteId: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              notes: t.notes.filter((n) => n.id !== noteId),
            }
          : t
      )
    );
  };

  return (
    <div className="text-[color:var(--foreground)]">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Task Studio
          </p>
          <h1 className="text-4xl md:text-5xl font-display">Tasks Management</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Organize priorities, capture notes, and keep every session accounted for.
          </p>
        </div>

        {/* Main Tasks Section */}
        <div className="panel-surface p-6 space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[color:var(--foreground)]">Your Tasks</h2>
              <p className="text-xs text-[color:var(--muted)]">{statusMessage}</p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  New task
                </label>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(event) => setNewTaskName(event.target.value)}
                  onKeyDown={handleNewTaskKeyDown}
                  className="input-premium w-full mt-2"
                  placeholder="e.g. Design review"
                />
              </div>
              <button
                onClick={handleAddTask}
                disabled={!canAddTask || newTaskName.trim().length === 0}
                className={`btn btn-primary px-4 py-2 text-sm ${
                  !canAddTask || newTaskName.trim().length === 0
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                Add Task
              </button>
            </div>

            {showUpgradeBanner && (
              <div className="card-surface p-4 border border-[color:var(--accent)] text-sm">
                <p className="text-[color:var(--foreground)] font-semibold">Upgrade to Pro</p>
                <p className="text-[color:var(--muted)] mt-1">
                  Free trial allows up to {TRIAL_TASK_LIMIT} tasks and {TRIAL_NOTE_LIMIT} notes per task.
                  Upgrade to Pro for unlimited tasks and notes.
                </p>
              </div>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[color:var(--muted)] text-lg">No tasks yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const totalDuration = calculateTaskDuration(task);
                const showNotes = expandedTaskId === task.id;
                return (
                  <div key={task.id} className="card-surface p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) => {
                            setTasks(
                              tasks.map((t) =>
                                t.id === task.id ? { ...t, name: e.target.value } : t
                              )
                            );
                          }}
                          className="input-premium w-full text-base font-semibold"
                          placeholder="Task name"
                        />
                        <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-[color:var(--muted)]">
                          <span className="inline-flex items-center rounded-full border border-[color:var(--border)] px-2.5 py-1">
                            Total: <span className="ml-1 text-[color:var(--foreground)]">{formatDuration(totalDuration)}</span>
                          </span>
                          <span className="inline-flex items-center rounded-full border border-[color:var(--border)] px-2.5 py-1">
                            Sessions: <span className="ml-1 text-[color:var(--foreground)]">{task.sessions.length}</span>
                          </span>
                          <span className="inline-flex items-center rounded-full border border-[color:var(--border)] px-2.5 py-1">
                            Notes: <span className="ml-1 text-[color:var(--foreground)]">{task.notes.length}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {task.notes.length > 0 ? (
                          <button
                            onClick={() =>
                              setExpandedTaskId(showNotes ? null : task.id)
                            }
                            className="btn btn-ghost px-3 py-2 text-xs"
                          >
                            {showNotes ? "Hide Notes" : "View Notes"}
                          </button>
                        ) : (
                          <span className="text-xs text-[color:var(--muted)]">No notes yet</span>
                        )}
                        <button
                          onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))}
                          className="btn btn-danger px-3 py-2 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {showNotes && task.notes.length > 0 && (
                      <div className="mt-2 border-t border-[color:var(--border)] pt-3 space-y-2">
                        <h4 className="font-semibold text-[color:var(--foreground)] text-sm">
                          Notes ({task.notes.length})
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {task.notes.map((note) => (
                            <div
                              key={note.id}
                              className="flex items-start justify-between gap-3 rounded-2xl border border-[color:var(--border)] p-3"
                            >
                              <div>
                                <p className="text-sm text-[color:var(--foreground)]">
                                  {note.description || "Untitled note"}
                                </p>
                                <p className="text-xs text-[color:var(--muted)] mt-1">
                                  {formatDuration(note.duration)} • {formatDate(note.createdAt)}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteNote(task.id, note.id)}
                                className="btn btn-danger px-2 py-1 text-[0.65rem] whitespace-nowrap"
                                title="Delete note"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Statistics Section */}
        {tasks.length > 0 && (
          <div className="panel-surface p-6">
            <h2 className="text-xl font-bold text-[color:var(--foreground)] mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="text-[color:var(--muted)] text-sm mb-1">Total Tasks</div>
                <div className="text-3xl font-bold text-[color:var(--foreground)]">{tasks.length}</div>
              </div>
              <div className="stat-card" data-tone="teal">
                <div className="text-[color:var(--muted)] text-sm mb-1">Total Time</div>
                <div className="text-3xl font-bold text-[color:var(--foreground)]">
                  {formatDuration(tasks.reduce((sum, task) => sum + calculateTaskDuration(task), 0))}
                </div>
              </div>
              <div className="stat-card" data-tone="sage">
                <div className="text-[color:var(--muted)] text-sm mb-1">Total Sessions</div>
                <div className="text-3xl font-bold text-[color:var(--foreground)]">
                  {tasks.reduce((sum, task) => sum + task.sessions.length, 0)}
                </div>
              </div>
              <div className="stat-card" data-tone="clay">
                <div className="text-[color:var(--muted)] text-sm mb-1">Total Notes</div>
                <div className="text-3xl font-bold text-[color:var(--foreground)]">
                  {tasks.reduce((sum, task) => sum + task.notes.length, 0)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
