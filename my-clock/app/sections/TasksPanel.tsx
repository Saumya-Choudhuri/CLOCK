"use client";

import { useEffect, useState } from "react";

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
  const [isMounted, setIsMounted] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    setIsMounted(true);
    let lastDataStr = "";

    const loadTasks = () => {
      const saved = window.localStorage.getItem("progress_data");
      if (saved) {
        try {
          // Only update if data has actually changed
          if (saved !== lastDataStr) {
            lastDataStr = saved;
            const data = JSON.parse(saved);
            const migratedTasks = (data.tasks || []).map((task: Task) => ({
              ...task,
              notes: task.notes || [],
            }));
            setTasks(migratedTasks);
          }
        } catch (error) {
          console.error("Failed to load progress data:", error);
          window.localStorage.removeItem("progress_data");
        }
      }
    };

    loadTasks();

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
    if (isMounted) {
      window.localStorage.setItem(
        "progress_data",
        JSON.stringify({ tasks })
      );
    }
  }, [tasks, isMounted]);

  // Calculate total duration for a task (including both sessions and notes)
  const calculateTaskDuration = (task: Task): number => {
    const sessionDuration = task.sessions.reduce((sum, session) => sum + session.duration, 0);
    const notesDuration = task.notes.reduce((sum, note) => sum + note.duration, 0);
    return sessionDuration + notesDuration;
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
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Tasks Management</h1>

        {/* Main Tasks Section */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                + Add New Task
              </button>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No tasks yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 space-y-3">
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
                      className="text-lg font-semibold bg-slate-600 text-white px-3 py-2 rounded flex-1 border border-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder="Task name"
                    />
                    <button
                      onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))}
                      className="px-3 py-2 bg-red-600/60 text-white text-sm rounded hover:bg-red-600/80 transition whitespace-nowrap"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-slate-600/50 rounded p-3">
                      <div className="text-slate-400 text-xs uppercase tracking-wide">Duration</div>
                      <div className="text-white font-mono text-lg">{formatDuration(calculateTaskDuration(task))}</div>
                    </div>
                    <div className="bg-slate-600/50 rounded p-3">
                      <div className="text-slate-400 text-xs uppercase tracking-wide">Notes</div>
                      <div className="text-white font-mono text-lg">{task.notes.length}</div>
                    </div>
                    <div className="bg-slate-600/50 rounded p-3">
                      <div className="text-slate-400 text-xs uppercase tracking-wide">Avg/Note</div>
                      <div className="text-white font-mono text-lg">
                        {task.notes.length > 0
                          ? formatDuration(calculateTaskDuration(task) / task.notes.length)
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  {(task.sessions.length > 0 || task.notes.length > 0) && (
                    <div className="text-xs text-slate-400 pt-2 border-t border-slate-600 space-y-1">
                      {task.sessions.length > 0 && (
                        <div>Sessions recorded: <span className="text-white font-semibold">{task.sessions.length}</span></div>
                      )}
                      {task.notes.length > 0 && (
                        <button
                          onClick={() =>
                            setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                          }
                          className="flex items-center gap-2 text-slate-300 hover:text-white transition w-full"
                        >
                          <span>{expandedTaskId === task.id ? "▼" : "▶"}</span>
                          <span>Notes: <span className="text-white font-semibold">{task.notes.length}</span></span>
                        </button>
                      )}
                    </div>
                  )}

                  {expandedTaskId === task.id && task.notes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-600 space-y-2">
                      <h4 className="font-semibold text-white text-sm">Notes ({task.notes.length})</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {task.notes.map((note, idx) => (
                          <div
                            key={note.id}
                            className="bg-slate-600/50 rounded p-3 border border-slate-600 text-sm hover:border-slate-500 transition"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-white font-medium">Note {idx + 1}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">{formatDate(note.createdAt)}</span>
                                <button
                                  onClick={() => handleDeleteNote(task.id, note.id)}
                                  className="text-xs bg-red-600/60 text-white px-2 py-1 rounded hover:bg-red-600/80 transition whitespace-nowrap"
                                  title="Delete note"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                            <p className="text-slate-300 mb-2">{note.description}</p>
                            <div className="text-xs text-slate-400">
                              Duration: <span className="text-slate-200 font-mono">{formatDuration(note.duration)}</span>
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
          <div className="mt-8 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="text-slate-400 text-sm mb-1">Total Tasks</div>
                <div className="text-3xl font-bold text-white">{tasks.length}</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="text-slate-400 text-sm mb-1">Total Time</div>
                <div className="text-3xl font-bold text-white">
                  {formatDuration(tasks.reduce((sum, task) => sum + calculateTaskDuration(task), 0))}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="text-slate-400 text-sm mb-1">Total Sessions</div>
                <div className="text-3xl font-bold text-white">
                  {tasks.reduce((sum, task) => sum + task.sessions.length, 0)}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="text-slate-400 text-sm mb-1">Total Notes</div>
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
