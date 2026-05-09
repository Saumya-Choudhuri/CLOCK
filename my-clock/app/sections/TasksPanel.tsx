"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getProgressDiagnostics } from "../utils/progressDiagnostics";

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
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const diagnosticsRef = useRef<string>("");

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

  // Load from localStorage
  useEffect(() => {
    let lastDataStr = "";

    const loadTasks = () => {
      const saved = window.localStorage.getItem("progress_data");
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
        window.localStorage.removeItem("progress_data");
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
    <div className="text-white">
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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-2">
            <h2 className="text-2xl font-bold text-white">Your Tasks</h2>
            {tasks.length < 10 && (
              <button
                onClick={() => {
                  const newTask: Task = {
                    id: Date.now().toString(),
                    name: `Task ${tasks.length + 1}`,
                    sessions: [],
                    notes: [],
                    isRunning: false,
                    currentSessionStart: null,
                  };
                  setTasks([...tasks, newTask]);
                }}
                className="btn btn-primary px-4 py-2 text-sm"
              >
                + Add New Task
              </button>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[color:var(--muted)] text-lg">No tasks yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="card-surface p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
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
                      className="input-premium w-full text-lg font-semibold"
                      placeholder="Task name"
                    />
                    <button
                      onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))}
                      className="btn btn-danger px-3 py-2 text-xs whitespace-nowrap"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="stat-card">
                      <div className="text-[color:var(--muted)] text-xs uppercase tracking-wide">Duration</div>
                      <div className="text-white clock-font tabular-nums text-lg">{formatDuration(calculateTaskDuration(task))}</div>
                    </div>
                    <div className="stat-card" data-tone="teal">
                      <div className="text-[color:var(--muted)] text-xs uppercase tracking-wide">Notes</div>
                      <div className="text-white clock-font tabular-nums text-lg">{task.notes.length}</div>
                    </div>
                    <div className="stat-card" data-tone="sage">
                      <div className="text-[color:var(--muted)] text-xs uppercase tracking-wide">Avg/Note</div>
                      <div className="text-white clock-font tabular-nums text-lg">
                        {task.notes.length > 0
                          ? formatDuration(calculateNotesDuration(task) / task.notes.length)
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  {(task.sessions.length > 0 || task.notes.length > 0) && (
                    <div className="text-xs text-[color:var(--muted)] pt-2 border-t border-[rgba(217,180,111,0.2)] space-y-1">
                      {task.sessions.length > 0 && (
                        <div>Sessions recorded: <span className="text-white font-semibold">{task.sessions.length}</span></div>
                      )}
                      {task.notes.length > 0 && (
                        <button
                          onClick={() =>
                            setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                          }
                          className="flex items-center gap-2 text-[color:var(--muted)] hover:text-white transition w-full"
                        >
                          <span>{expandedTaskId === task.id ? "▼" : "▶"}</span>
                          <span>Notes: <span className="text-white font-semibold">{task.notes.length}</span></span>
                        </button>
                      )}
                    </div>
                  )}

                  {expandedTaskId === task.id && task.notes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[rgba(217,180,111,0.2)] space-y-2">
                      <h4 className="font-semibold text-white text-sm">Notes ({task.notes.length})</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {task.notes.map((note, idx) => (
                          <div
                            key={note.id}
                            className="card-surface p-3 text-sm"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-white font-medium">Note {idx + 1}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[color:var(--muted)]">{formatDate(note.createdAt)}</span>
                                <button
                                  onClick={() => handleDeleteNote(task.id, note.id)}
                                  className="btn btn-danger px-2 py-1 text-[0.65rem] whitespace-nowrap"
                                  title="Delete note"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                            <p className="text-[color:var(--muted)] mb-2">{note.description}</p>
                            <div className="text-xs text-[color:var(--muted)]">
                              Duration: <span className="text-white clock-font tabular-nums">{formatDuration(note.duration)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics Section */}
        {tasks.length > 0 && (
          <div className="panel-surface p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="text-[color:var(--muted)] text-sm mb-1">Total Tasks</div>
                <div className="text-3xl font-bold text-white">{tasks.length}</div>
              </div>
              <div className="stat-card" data-tone="teal">
                <div className="text-[color:var(--muted)] text-sm mb-1">Total Time</div>
                <div className="text-3xl font-bold text-white">
                  {formatDuration(tasks.reduce((sum, task) => sum + calculateTaskDuration(task), 0))}
                </div>
              </div>
              <div className="stat-card" data-tone="sage">
                <div className="text-[color:var(--muted)] text-sm mb-1">Total Sessions</div>
                <div className="text-3xl font-bold text-white">
                  {tasks.reduce((sum, task) => sum + task.sessions.length, 0)}
                </div>
              </div>
              <div className="stat-card" data-tone="clay">
                <div className="text-[color:var(--muted)] text-sm mb-1">Total Notes</div>
                <div className="text-3xl font-bold text-white">
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
