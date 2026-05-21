"use client";

import { useCallback, useEffect, useState } from "react";

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

interface ProgressPanelProps {
  onStartTask?: (taskId: string, taskName: string) => void;
  onTaskSessionComplete?: (taskId: string, duration: number) => void;
  currentProgressTask?: { id: string; name: string } | null;
}

export default function ProgressPanel({
  onStartTask,
  onTaskSessionComplete,
  currentProgressTask,
}: ProgressPanelProps) {
  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNameInput, setShowNameInput] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Declare functions before useEffect
  const addSessionToTask = useCallback((taskId: string, duration: number) => {
    const endTime = Date.now();
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              sessions: [
                ...t.sessions,
                {
                  startTime: endTime - duration,
                  endTime: endTime,
                  duration,
                },
              ],
            }
          : t
      )
    );
  }, []);

  const handleAddNote = useCallback((taskId: string, note: TaskNote) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              notes: [...t.notes, note],
            }
          : t
      )
    );
    if (onTaskSessionComplete) {
      onTaskSessionComplete(taskId, note.duration);
    }
  }, [onTaskSessionComplete]);

  const saveProgressData = useCallback((updatedUserName: string, updatedTasks: Task[]) => {
    try {
      const existing = window.localStorage.getItem("progress_data");
      const parsed = existing ? JSON.parse(existing) : null;
      const payload = parsed && typeof parsed === "object"
        ? { ...parsed, userName: updatedUserName, tasks: updatedTasks }
        : { userName: updatedUserName, tasks: updatedTasks };
      window.localStorage.setItem("progress_data", JSON.stringify(payload));
    } catch (error) {
      console.error("Failed to save progress data:", error);
      window.localStorage.setItem(
        "progress_data",
        JSON.stringify({ userName: updatedUserName, tasks: updatedTasks })
      );
    }
  }, []);

  // Load from localStorage
  useEffect(() => {
    setIsMounted(true);
    const saved = window.localStorage.getItem("progress_data");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setUserName(data.userName || "");
        // Ensure all tasks have notes property (migration for old data)
        const migratedTasks = (data.tasks || []).map((task: Task) => ({
          ...task,
          sessions: task.sessions || [],
          notes: task.notes || [],
        }));
        setTasks(migratedTasks);
        setShowNameInput(!data.userName);
      } catch (error) {
        console.error("Failed to load progress data:", error);
        setShowNameInput(true);
      }
    }
  }, []);

  // Check for pending sessions from Counter
  useEffect(() => {
    if (isMounted && currentProgressTask) {
      const pending = window.localStorage.getItem("pending_session");
      if (pending) {
        try {
          const { taskId, duration } = JSON.parse(pending);
          if (taskId === currentProgressTask.id) {
            addSessionToTask(taskId, duration);
            window.localStorage.removeItem("pending_session");
          }
        } catch (error) {
          console.error("Failed to parse pending session:", error);
          window.localStorage.removeItem("pending_session");
        }
      }
    }
  }, [isMounted, currentProgressTask, addSessionToTask]);

  // Check for pending notes from Counter
  useEffect(() => {
    if (isMounted && currentProgressTask) {
      const pending = window.localStorage.getItem("pending_note");
      if (pending) {
        try {
          const { taskId, note } = JSON.parse(pending);
          if (taskId === currentProgressTask.id) {
            handleAddNote(taskId, note);
            window.localStorage.removeItem("pending_note");
          }
        } catch (error) {
          console.error("Failed to parse pending note:", error);
          window.localStorage.removeItem("pending_note");
        }
      }
    }
  }, [isMounted, currentProgressTask, handleAddNote]);

  // Save to localStorage
  useEffect(() => {
    if (isMounted) {
      saveProgressData(userName, tasks);
    }
  }, [userName, tasks, isMounted, saveProgressData]);

  const handleAddName = (name: string) => {
    if (name.trim()) {
      setUserName(name);
      setShowNameInput(false);
    }
  };

  const handleAddTask = () => {
    if (tasks.length < 10) {
      const newTask: Task = {
        id: Date.now().toString(),
        name: `Task ${tasks.length + 1}`,
        sessions: [],
        notes: [],
        isRunning: false,
        currentSessionStart: null,
      };
      setTasks([...tasks, newTask]);
    }
  };

  const handleRemoveTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleStartTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task && onStartTask) {
      onStartTask(id, task.name);
    }
  };

  const handleStopTask = (id: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === id && t.isRunning && t.currentSessionStart) {
          const duration = Date.now() - t.currentSessionStart;
          return {
            ...t,
            isRunning: false,
            sessions: [
              ...t.sessions,
              {
                startTime: t.currentSessionStart,
                endTime: Date.now(),
                duration,
              },
            ],
            currentSessionStart: null,
          };
        }
        return t;
      })
    );
  };

  const handleDeleteSession = (taskId: string, sessionIndex: number) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              sessions: t.sessions.filter((_, i) => i !== sessionIndex),
            }
          : t
      )
    );
  };

  const getTotalTime = (task: Task) => {
    const total = task.sessions.reduce((sum, s) => sum + s.duration, 0);
    const seconds = Math.floor(total / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

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

  if (!isMounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 flex flex-col items-center">
      {showNameInput ? (
        <div className="panel-surface p-6 space-y-4 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-[color:var(--foreground)]">Welcome to Progress Tracker</h2>
          <input
            type="text"
            placeholder="Enter your name"
            className="input-premium w-full text-center"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddName(e.currentTarget.value);
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
              handleAddName(input.value);
            }}
            className="btn btn-primary w-full px-4 py-2 text-sm"
          >
            Start
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center w-full gap-4">
            <h2 className="text-2xl font-bold text-[color:var(--foreground)]">{userName}&apos;s Progress</h2>
          </div>

          {/* Add Task and Change Name Buttons */}
          <div className="flex items-center justify-between w-full">
            {tasks.length < 10 && (
              <button
                onClick={handleAddTask}
                className="btn btn-primary px-4 py-2 text-sm"
              >
                + Add Task ({tasks.length}/10)
              </button>
            )}
            <button
              onClick={() => {
                setUserName("");
                setShowNameInput(true);
              }}
              className="btn btn-ghost px-3 py-1 text-xs ml-auto"
            >
              Change Name
            </button>
          </div>

          {/* Tasks List */}
          <div className="space-y-4 w-full">
            {tasks.length === 0 ? (
              <p className="text-[color:var(--muted)] text-center">Add a task to get started!</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="card-surface p-4 space-y-3 max-w-2xl mx-auto w-full"
                >
                  <div className="flex items-center justify-between">
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
                    />
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="btn btn-danger px-3 py-1 text-xs ml-2"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {!task.isRunning ? (
                      <button
                        onClick={() => handleStartTask(task.id)}
                        className="btn btn-primary px-4 py-2 text-sm"
                      >
                        Start
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStopTask(task.id)}
                        className="btn btn-danger px-4 py-2 text-sm"
                      >
                        Stop
                      </button>
                    )}
                  </div>

                  <div className="text-sm text-[color:var(--muted)]">
                    <p>Total Time: <span className="clock-font tabular-nums text-[color:var(--foreground)]">{getTotalTime(task)}</span></p>
                    <p>Sessions: <span className="clock-font tabular-nums text-[color:var(--foreground)]">{task.sessions.length}</span></p>
                  </div>

                  {task.sessions.length > 0 && (
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="text-[color:var(--muted)] font-medium">Recent Sessions:</p>
                      {task.sessions.slice(-3).map((session, idx) => {
                        const duration = session.duration / 1000;
                        const hours = Math.floor(duration / 3600);
                        const minutes = Math.floor((duration % 3600) / 60);
                        const secs = Math.floor(duration % 60);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between card-surface p-2 text-[color:var(--muted)]"
                          >
                            <span>
                              {new Date(session.startTime).toLocaleTimeString()} -{" "}
                              {hours}h {minutes}m {secs}s
                            </span>
                            <button
                              onClick={() =>
                                handleDeleteSession(
                                  task.id,
                                  task.sessions.indexOf(session)
                                )
                              }
                              className="btn btn-danger px-2 py-1 text-[0.65rem]"
                            >
                              Delete
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {task.notes.length > 0 && (
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="text-[color:var(--muted)] font-medium">Notes:</p>
                      {task.notes.slice(-3).map((note) => {
                        const duration = note.duration / 1000;
                        const hours = Math.floor(duration / 3600);
                        const minutes = Math.floor((duration % 3600) / 60);
                        const secs = Math.floor(duration % 60);
                        return (
                          <div
                            key={note.id}
                            className="flex items-center justify-between card-surface p-2 text-[color:var(--muted)]"
                          >
                            <div className="flex-1">
                              <span className="text-[color:var(--foreground)] font-medium">{note.description}</span>
                              <span className="ml-2 text-[color:var(--muted)]">
                                {hours}h {minutes}m {secs}s
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteNote(task.id, note.id)}
                              className="btn btn-danger px-2 py-1 text-[0.65rem] ml-2"
                            >
                              Delete
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}