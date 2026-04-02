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

interface ProgressPanelProps {
  onStartTask?: (taskId: string, taskName: string) => void;
  onTaskSessionComplete?: (taskId: string, duration: number) => void;
  onAddTaskNote?: (taskId: string, note: TaskNote) => void;
  currentProgressTask?: { id: string; name: string } | null;
  onClearCurrentTask?: () => void;
}

export default function ProgressPanel({
  onStartTask,
  onTaskSessionComplete,
  onAddTaskNote,
  currentProgressTask,
  onClearCurrentTask,
}: ProgressPanelProps) {
  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNameInput, setShowNameInput] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setIsMounted(true);
    const saved = window.localStorage.getItem("progress_data");
    if (saved) {
      const data = JSON.parse(saved);
      setUserName(data.userName || "");
      // Ensure all tasks have notes property (migration for old data)
      const migratedTasks = (data.tasks || []).map((task: Task) => ({
        ...task,
        notes: task.notes || [],
      }));
      setTasks(migratedTasks);
      setShowNameInput(!data.userName);
    }
  }, []);

  // Check for pending sessions from Counter
  useEffect(() => {
    if (isMounted && currentProgressTask) {
      const pending = window.localStorage.getItem("pending_session");
      if (pending) {
        const { taskId, duration } = JSON.parse(pending);
        if (taskId === currentProgressTask.id) {
          addSessionToTask(taskId, duration);
          window.localStorage.removeItem("pending_session");
        }
      }
    }
  }, [isMounted, currentProgressTask]);

  // Check for pending notes from Counter
  useEffect(() => {
    if (isMounted && currentProgressTask) {
      const pending = window.localStorage.getItem("pending_note");
      if (pending) {
        const { taskId, note } = JSON.parse(pending);
        if (taskId === currentProgressTask.id) {
          handleAddNote(taskId, note);
          window.localStorage.removeItem("pending_note");
        }
      }
    }
  }, [isMounted, currentProgressTask]);

  // Save to localStorage
  useEffect(() => {
    if (isMounted) {
      window.localStorage.setItem(
        "progress_data",
        JSON.stringify({ userName, tasks })
      );
    }
  }, [userName, tasks, isMounted]);

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

  const addSessionToTask = (taskId: string, duration: number) => {
    const endTime = Date.now();
    setTasks(
      tasks.map((t) =>
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
  };

  const handleAddNote = (taskId: string, note: TaskNote) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              notes: [...t.notes, note],
            }
          : t
      )
    );
    if (onAddTaskNote) {
      onAddTaskNote(taskId, note);
    }
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

  const getMonthlyStats = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyData: { [key: string]: number } = {};

    tasks.forEach((task) => {
      task.sessions.forEach((session) => {
        const sessionDate = new Date(session.startTime);
        if (sessionDate >= monthStart && sessionDate <= monthEnd) {
          if (!monthlyData[task.name]) {
            monthlyData[task.name] = 0;
          }
          monthlyData[task.name] += session.duration;
        }
      });
    });

    return monthlyData;
  };

  const monthlyStats = getMonthlyStats();
  const totalMonthlyTime = Object.values(monthlyStats).reduce(
    (sum, time) => sum + time,
    0
  );

  if (!isMounted) return null;

  return (
    <div className="max-w-4xl space-y-6">
      {showNameInput ? (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-4">
          <h2 className="text-2xl font-bold text-white">Welcome to Progress Tracker</h2>
          <input
            type="text"
            placeholder="Enter your name"
            className="w-full px-4 py-2 rounded bg-slate-700 text-white placeholder-slate-400 border border-slate-600"
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
            className="px-4 py-2 bg-[#FFEDDF] text-slate-900 rounded font-medium hover:bg-orange-100 transition"
          >
            Start
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{userName}&apos;s Progress</h2>
            <button
              onClick={() => {
                setUserName("");
                setShowNameInput(true);
              }}
              className="px-3 py-1 text-sm bg-slate-700 text-slate-100 rounded hover:bg-slate-600 transition"
            >
              Change Name
            </button>
          </div>

          {/* Add Task Button */}
          {tasks.length < 10 && (
            <button
              onClick={handleAddTask}
              className="px-4 py-2 bg-[#FFEDDF] text-slate-900 rounded font-medium hover:bg-orange-100 transition"
            >
              + Add Task ({tasks.length}/10)
            </button>
          )}

          {/* Tasks List */}
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-slate-400">Add a task to get started!</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3"
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
                      className="text-lg font-semibold text-white bg-slate-700 px-3 py-1 rounded w-full"
                    />
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="px-3 py-1 text-sm bg-red-600/60 text-white rounded hover:bg-red-600/80 transition ml-2"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {!task.isRunning ? (
                      <button
                        onClick={() => handleStartTask(task.id)}
                        className="px-4 py-2 bg-green-600/60 text-white rounded hover:bg-green-600/80 transition"
                      >
                        Start
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStopTask(task.id)}
                        className="px-4 py-2 bg-red-600/60 text-white rounded hover:bg-red-600/80 transition"
                      >
                        Stop
                      </button>
                    )}
                  </div>

                  <div className="text-sm text-slate-300">
                    <p>Total Time: <span className="font-mono text-white">{getTotalTime(task)}</span></p>
                    <p>Sessions: <span className="font-mono text-white">{task.sessions.length}</span></p>
                  </div>

                  {task.sessions.length > 0 && (
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="text-slate-300 font-medium">Recent Sessions:</p>
                      {task.sessions.slice(-3).map((session, idx) => {
                        const duration = session.duration / 1000;
                        const hours = Math.floor(duration / 3600);
                        const minutes = Math.floor((duration % 3600) / 60);
                        const secs = Math.floor(duration % 60);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-slate-700 p-2 rounded text-slate-300"
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
                              className="text-xs bg-red-600/40 px-2 py-1 rounded hover:bg-red-600/60"
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
                      <p className="text-slate-300 font-medium">Notes:</p>
                      {task.notes.slice(-3).map((note) => {
                        const duration = note.duration / 1000;
                        const hours = Math.floor(duration / 3600);
                        const minutes = Math.floor((duration % 3600) / 60);
                        const secs = Math.floor(duration % 60);
                        return (
                          <div
                            key={note.id}
                            className="flex items-center justify-between bg-blue-900/50 p-2 rounded text-slate-300 border border-blue-700/50"
                          >
                            <div className="flex-1">
                              <span className="text-white font-medium">{note.description}</span>
                              <span className="ml-2 text-slate-400">
                                {hours}h {minutes}m {secs}s
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteNote(task.id, note.id)}
                              className="text-xs bg-red-600/40 px-2 py-1 rounded hover:bg-red-600/60 ml-2"
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

          {/* Monthly Report */}
          {tasks.length > 0 && (
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">Monthly Report</h3>
              {Object.keys(monthlyStats).length === 0 ? (
                <p className="text-slate-400">No data for this month yet</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(monthlyStats).map(([taskName, duration]) => {
                    const seconds = Math.floor(duration / 1000);
                    const hours = Math.floor(seconds / 3600);
                    const minutes = Math.floor((seconds % 3600) / 60);
                    const secs = seconds % 60;
                    const percentage =
                      totalMonthlyTime > 0
                        ? ((duration / totalMonthlyTime) * 100).toFixed(1)
                        : 0;

                    return (
                      <div key={taskName} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-white font-medium">{taskName}</span>
                          <span className="text-slate-300">
                            {hours}h {minutes}m {secs}s ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-[#FFEDDF] h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-3 border-t border-slate-600">
                    <p className="text-slate-300">
                      Total Monthly Time:{" "}
                      <span className="text-white font-mono">
                        {Math.floor(totalMonthlyTime / 3600000)}h{" "}
                        {Math.floor((totalMonthlyTime % 3600000) / 60000)}m
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}