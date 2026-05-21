"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
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

interface AnalyticsPanelProps {
  tasks?: Task[];
}

type ChartType = "pie" | "bar" | "line";
type TimePeriod = "daily" | "weekly" | "monthly" | "all";
type DataMode = "sessions" | "notes" | "total";

const COLORS = [
  "#0D0F12",
  "#C9FF3B",
  "#4BB3FD",
  "#F4B266",
  "#E75F5B",
  "#5CCEAC",
  "#8D93A1",
  "#FFD36E",
  "#F3A3D3",
  "#9AD4FF",
];

export default function AnalyticsPanel({ tasks: initialTasks = [] }: AnalyticsPanelProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [chartType, setChartType] = useState<ChartType>("pie");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [dataMode, setDataMode] = useState<DataMode>("sessions");
  const [isMounted, setIsMounted] = useState(false);
  const diagnosticsRef = useRef<string>("");

  const nameCounts = useMemo(() => {
    const counts = new Map<string, number>();
    tasks.forEach((task) => {
      counts.set(task.name, (counts.get(task.name) ?? 0) + 1);
    });
    return counts;
  }, [tasks]);

  const diagnostics = useMemo(() => getProgressDiagnostics(tasks), [tasks]);

  useEffect(() => {
    if (diagnostics.length === 0) {
      diagnosticsRef.current = "";
      return;
    }

    const signature = diagnostics.map((issue) => issue.code).join("|");
    if (signature === diagnosticsRef.current) return;
    diagnosticsRef.current = signature;
    console.warn("[AnalyticsPanel] Progress data diagnostics", diagnostics);
  }, [diagnostics]);

  const getTaskLabel = (task: Task) => {
    const count = nameCounts.get(task.name) ?? 0;
    if (count > 1) {
      const suffix = task.id.slice(-4) || task.id;
      return `${task.name} (${suffix})`;
    }
    return task.name;
  };

  const getNoteLabel = (task: Task, note: TaskNote) => {
    const trimmed = note.description?.trim() || "Untitled note";
    const base = trimmed.length > 26 ? `${trimmed.slice(0, 26)}…` : trimmed;
    const suffix = note.id?.slice(-4) || task.id.slice(-4) || "note";
    return `${task.name}: ${base} (${suffix})`;
  };

  // Load from localStorage
  useEffect(() => {
    setIsMounted(true);
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

    // Poll localStorage for changes (less frequently to reduce re-renders)
    const interval = setInterval(loadTasks, 1000);

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

  // Calculate total duration for a task (including both sessions and notes)
  const getTaskSessionsDuration = (task: Task): number => {
    return task.sessions.reduce((sum, session) => sum + session.duration, 0);
  };

  const getTaskNotesDuration = (task: Task): number => {
    return task.notes.reduce((sum, note) => sum + note.duration, 0);
  };

  const calculateTaskDuration = (task: Task): number => {
    return getTaskSessionsDuration(task) + getTaskNotesDuration(task);
  };

  const getTaskDurationByMode = (task: Task): number => {
    if (dataMode === "sessions") return getTaskSessionsDuration(task);
    if (dataMode === "notes") return getTaskNotesDuration(task);
    return calculateTaskDuration(task);
  };

  const getEntryCountByMode = (task: Task): number => {
    if (dataMode === "sessions") return task.sessions.length;
    if (dataMode === "notes") return task.notes.length;
    return task.sessions.length + task.notes.length;
  };

  // Format milliseconds to hours and minutes and seconds
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Format milliseconds to decimal hours
  const formatToHours = (ms: number): number => {
    return ms / 3600000;
  };

  // Get filtered tasks based on time period
  const getFilteredTasks = (): Task[] => {
    if (timePeriod === "all") return tasks;

    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const timeRanges: Record<TimePeriod, number> = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
      all: Infinity,
    };

    const cutoff = now - timeRanges[timePeriod];

    return tasks.map((task) => ({
      ...task,
      sessions: task.sessions.filter((session) => session.startTime >= cutoff),
      notes: task.notes.filter((note) => note.createdAt >= cutoff),
    }));
  };

  // Prepare data for pie chart
  const getPieChartData = () => {
    const filteredTasks = getFilteredTasks();
    if (dataMode === "total") {
      return filteredTasks
        .flatMap((task) => {
          const sessionsDuration = getTaskSessionsDuration(task);
          const notesDuration = getTaskNotesDuration(task);
          const label = getTaskLabel(task);
          return [
            {
              name: `${label} · Sessions`,
              value: formatToHours(sessionsDuration),
              duration: sessionsDuration,
            },
            {
              name: `${label} · Notes`,
              value: formatToHours(notesDuration),
              duration: notesDuration,
            },
          ];
        })
        .filter((entry) => entry.duration > 0);
    }
    if (dataMode === "notes") {
      return filteredTasks
        .flatMap((task) =>
          task.notes.map((note) => ({
            name: getNoteLabel(task, note),
            value: formatToHours(note.duration),
            duration: note.duration,
          }))
        )
        .filter((entry) => entry.duration > 0);
    }
    return filteredTasks
      .filter((task) => getTaskDurationByMode(task) > 0)
      .map((task) => {
        const duration = getTaskDurationByMode(task);
        return {
          name: getTaskLabel(task),
          value: formatToHours(duration),
          duration,
        };
      });
  };

  // Prepare data for bar chart
  const getBarChartData = () => {
    const filteredTasks = getFilteredTasks();
    if (dataMode === "total") {
      return filteredTasks
        .map((task) => ({
          name: getTaskLabel(task),
          sessions: formatToHours(getTaskSessionsDuration(task)),
          notes: formatToHours(getTaskNotesDuration(task)),
        }))
        .filter((entry) => entry.sessions > 0 || entry.notes > 0)
        .sort((a, b) => b.sessions + b.notes - (a.sessions + a.notes));
    }
    if (dataMode === "notes") {
      return filteredTasks
        .flatMap((task) =>
          task.notes.map((note) => ({
            name: getNoteLabel(task, note),
            duration: formatToHours(note.duration),
            entries: 1,
          }))
        )
        .filter((entry) => entry.duration > 0)
        .sort((a, b) => b.duration - a.duration);
    }
    return filteredTasks
      .filter((task) => getTaskDurationByMode(task) > 0)
      .map((task) => ({
        name: getTaskLabel(task),
        duration: formatToHours(getTaskDurationByMode(task)),
        entries: getEntryCountByMode(task),
      }))
      .sort((a, b) => b.duration - a.duration);
  };

  const formatDayKey = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return {
      key: `${year}-${month}-${day}`,
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  };

  // Prepare data for line chart (by day)
  const getLineChartData = () => {
    const filteredTasks = getFilteredTasks();
    const dailyData: Record<string, { label: string; values: Record<string, number> }> = {};

    const addToDaily = (timestamp: number, label: string, duration: number) => {
      const dayMeta = formatDayKey(timestamp);

      if (!dailyData[dayMeta.key]) {
        dailyData[dayMeta.key] = { label: dayMeta.label, values: {} };
      }

      dailyData[dayMeta.key].values[label] =
        (dailyData[dayMeta.key].values[label] || 0) + duration;
    };

    filteredTasks.forEach((task) => {
      const taskLabel = getTaskLabel(task);
      if (dataMode === "sessions" || dataMode === "total") {
        task.sessions.forEach((session) => {
          addToDaily(session.startTime, taskLabel, session.duration);
        });
      }

      if (dataMode === "notes" || dataMode === "total") {
        task.notes.forEach((note) => {
          const noteLabel = dataMode === "notes" ? getNoteLabel(task, note) : taskLabel;
          addToDaily(note.createdAt, noteLabel, note.duration);
        });
      }
    });

    if (dataMode === "total") {
      const totals: Record<string, { label: string; sessions: number; notes: number }> = {};

      filteredTasks.forEach((task) => {
        task.sessions.forEach((session) => {
          const dayMeta = formatDayKey(session.startTime);
          if (!totals[dayMeta.key]) {
            totals[dayMeta.key] = { label: dayMeta.label, sessions: 0, notes: 0 };
          }
          totals[dayMeta.key].sessions += session.duration;
        });

        task.notes.forEach((note) => {
          const dayMeta = formatDayKey(note.createdAt);
          if (!totals[dayMeta.key]) {
            totals[dayMeta.key] = { label: dayMeta.label, sessions: 0, notes: 0 };
          }
          totals[dayMeta.key].notes += note.duration;
        });
      });

      return Object.entries(totals)
        .map(([key, data]) => ({
          key,
          date: data.label,
          Sessions: formatToHours(data.sessions),
          Notes: formatToHours(data.notes),
        }))
        .sort((a, b) => a.key.localeCompare(b.key))
        .map(({ key, ...rest }) => rest);
    }

    return Object.entries(dailyData)
      .map(([key, data]) => ({
        key,
        date: data.label,
        ...Object.fromEntries(
          Object.entries(data.values).map(([taskLabel, duration]) => [
            taskLabel,
            formatToHours(duration),
          ])
        ),
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key, ...rest }) => rest);
  };

  // Calculate statistics
  const calculateStats = () => {
    const filteredTasks = getFilteredTasks();
    const totalDuration = filteredTasks.reduce(
      (sum, task) => sum + getTaskDurationByMode(task),
      0
    );
    const totalEntries = filteredTasks.reduce(
      (sum, task) => sum + getEntryCountByMode(task),
      0
    );
    const avgDurationPerEntry =
      totalEntries > 0 ? totalDuration / totalEntries : 0;
    const mostProductiveTask = filteredTasks.length > 0
      ? filteredTasks.reduce((max, task) =>
          getTaskDurationByMode(task) > getTaskDurationByMode(max) ? task : max
        )
      : null;

    return {
      totalDuration,
      totalEntries,
      avgDurationPerEntry,
      mostProductiveTask,
      totalTasks: filteredTasks.filter((t) => getTaskDurationByMode(t) > 0).length,
    };
  };

  // Export analytics data
  const handleExportData = () => {
    const stats = calculateStats();
    const chartData =
      chartType === "pie"
        ? getPieChartData()
        : chartType === "bar"
          ? getBarChartData()
          : getLineChartData();

    const exportData = {
      exportDate: new Date().toISOString(),
      timePeriod,
      chartType,
      dataMode,
      statistics: {
        totalDuration: formatDuration(stats.totalDuration),
        totalEntries: stats.totalEntries,
        avgDurationPerEntry: formatDuration(stats.avgDurationPerEntry),
        mostProductiveTask: stats.mostProductiveTask?.name || "N/A",
        totalTasks: stats.totalTasks,
      },
      chartData,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isMounted) return null;

  const stats = calculateStats();
  const pieData = getPieChartData();
  const barData = getBarChartData();
  const lineData = getLineChartData();
  const entryLabel =
    dataMode === "notes"
      ? "Total Notes"
      : dataMode === "sessions"
        ? "Total Sessions"
        : "Total Entries";
  const entryLabelShort = dataMode === "notes" ? "Notes" : dataMode === "sessions" ? "Sessions" : "Entries";
  const avgLabel =
    dataMode === "notes"
      ? "Avg Note"
      : dataMode === "sessions"
        ? "Avg Session"
        : "Avg Entry";
  const dataModeLabel =
    dataMode === "notes"
      ? "Notes only"
      : dataMode === "sessions"
        ? "Sessions only"
        : "Sessions + Notes";
  const notesSummary = dataMode === "notes"
    ? getFilteredTasks()
        .flatMap((task) =>
          task.notes.map((note) => ({
            id: note.id,
            taskName: task.name,
            description: note.description || "Untitled note",
            duration: note.duration,
            createdAt: note.createdAt,
          }))
        )
        .filter((note) => note.duration > 0)
        .sort((a, b) => b.duration - a.duration)
    : [];

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Insights</p>
            <h2 className="text-3xl md:text-4xl font-display text-[color:var(--foreground)]">Analytics Dashboard</h2>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between panel-surface p-4">
            {/* Chart Type Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setChartType("pie")}
                className={`btn px-4 py-2 text-xs uppercase tracking-[0.18em] ${
                  chartType === "pie" ? "btn-primary" : "btn-ghost"
                }`}
              >
                Pie Chart
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`btn px-4 py-2 text-xs uppercase tracking-[0.18em] ${
                  chartType === "bar" ? "btn-primary" : "btn-ghost"
                }`}
              >
                Bar Chart
              </button>
              <button
                onClick={() => setChartType("line")}
                className={`btn px-4 py-2 text-xs uppercase tracking-[0.18em] ${
                  chartType === "line" ? "btn-primary" : "btn-ghost"
                }`}
              >
                Line Chart
              </button>
            </div>

            {/* Time Period Selector */}
            <div className="flex flex-wrap gap-2">
              <select
                value={dataMode}
                onChange={(e) => setDataMode(e.target.value as DataMode)}
                className="select-premium w-auto"
              >
                <option value="sessions">Sessions only</option>
                <option value="notes">Notes only</option>
                <option value="total">Sessions + Notes</option>
              </select>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
                className="select-premium w-auto"
              >
                <option value="daily">Last 24 Hours</option>
                <option value="weekly">Last 7 Days</option>
                <option value="monthly">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>

              {/* Export Button */}
              <button
                onClick={handleExportData}
                className="btn btn-primary px-4 py-2 text-xs uppercase tracking-[0.18em]"
              >
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="text-[color:var(--muted)] text-sm font-medium">Total Time</div>
            <div className="text-2xl font-bold text-[color:var(--foreground)] mt-2 clock-font tabular-nums">
              {formatDuration(stats.totalDuration)}
            </div>
          </div>

          <div className="stat-card" data-tone="teal">
            <div className="text-[color:var(--muted)] text-sm font-medium">{entryLabel}</div>
            <div className="text-2xl font-bold text-[color:var(--foreground)] mt-2 clock-font tabular-nums">
              {stats.totalEntries}
            </div>
          </div>

          <div className="stat-card" data-tone="sage">
            <div className="text-[color:var(--muted)] text-sm font-medium">{avgLabel}</div>
            <div className="text-2xl font-bold text-[color:var(--foreground)] mt-2 clock-font tabular-nums">
              {formatDuration(stats.avgDurationPerEntry)}
            </div>
          </div>

          <div className="stat-card" data-tone="clay">
            <div className="text-[color:var(--muted)] text-sm font-medium">Active Tasks</div>
            <div className="text-2xl font-bold text-[color:var(--foreground)] mt-2 clock-font tabular-nums">
              {stats.totalTasks}
            </div>
          </div>
        </div>

        {diagnostics.length > 0 && (
          <div className="panel-surface p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Diagnostics
            </div>
            <div className="mt-2 space-y-1 text-xs text-[color:var(--muted)]">
              {diagnostics.map((issue, index) => (
                <div key={`${issue.code}-${index}`}>
                  {issue.level.toUpperCase()}: {issue.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most Productive Task */}
        {dataMode !== "notes" && stats.mostProductiveTask && (
          <div className="panel-surface p-4">
            <div className="text-[color:var(--muted)] text-sm font-medium">Most Productive Task</div>
            <div className="text-xl font-bold text-[color:var(--accent)] mt-2">
              {stats.mostProductiveTask.name}
            </div>
            <div className="text-[color:var(--muted)] text-sm mt-1">
              {formatDuration(getTaskDurationByMode(stats.mostProductiveTask))} spent
            </div>
          </div>
        )}

        {dataMode === "notes" && notesSummary.length > 0 && (
          <div className="panel-surface p-4">
            <div className="text-[color:var(--muted)] text-sm font-medium">Longest Note</div>
            <div className="text-xl font-bold text-[color:var(--accent)] mt-2">
              {notesSummary[0].description}
            </div>
            <div className="text-[color:var(--muted)] text-sm mt-1">
              {notesSummary[0].taskName} • {formatDuration(notesSummary[0].duration)}
            </div>
          </div>
        )}

          {/* Chart Section */}
        <div className="panel-surface p-6">
          <h3 className="text-xl font-bold text-[color:var(--foreground)] mb-2">
            {chartType === "pie"
              ? "Time Distribution"
              : chartType === "bar"
                ? "Tasks by Duration"
                : "Daily Progress"}
          </h3>
          <p className="text-xs text-[color:var(--muted)] mb-6">
            Mode: {dataModeLabel} | Period: {timePeriod === "daily" ? "Last 24 Hours" : timePeriod === "weekly" ? "Last 7 Days" : timePeriod === "monthly" ? "Last 30 Days" : "All Time"} | 
            Tasks with data: {getFilteredTasks().filter((t) => getTaskDurationByMode(t) > 0).length} | 
            {entryLabel}: {stats.totalEntries}
          </p>

          {pieData.length === 0 && barData.length === 0 && lineData.length === 0 ? (
            <div className="flex items-center justify-center h-80 text-[color:var(--muted)]">
              <div className="text-center">
                <p>No data available for the selected period</p>
                <p className="text-sm mt-2">Start tracking tasks to see analytics</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={400}
              key={`${chartType}-${dataMode}-${timePeriod}`}
            >
              {chartType === "pie" && pieData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, payload }) => {
                      const duration = payload?.duration ?? 0;
                      return `${name}: ${formatDuration(duration)}`;
                    }}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, props) => {
                      const payload = (props as any)?.payload;
                      const duration = payload?.duration ?? 0;
                      return formatDuration(duration);
                    }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(13, 15, 18, 0.15)",
                      borderRadius: "10px",
                      color: "#0d0f12",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ color: "#5a5f66" }}
                  />
                </PieChart>
              ) : chartType === "bar" && barData.length > 0 ? (
                <BarChart data={barData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#d6d4cf"
                  />
                  <XAxis dataKey="name" stroke="#5a5f66" />
                  <YAxis stroke="#5a5f66" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (typeof value !== "number") return "0";
                      if (name === "duration") return `${value.toFixed(2)}h`;
                      return value.toFixed(0);
                    }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(13, 15, 18, 0.15)",
                      borderRadius: "10px",
                      color: "#0d0f12",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#5a5f66" }} />
                  {dataMode === "total" ? (
                    <>
                      <Bar dataKey="sessions" fill="#0D0F12" name="Sessions">
                        <LabelList
                          dataKey="sessions"
                          position="top"
                          formatter={(value) =>
                            typeof value === "number" ? `${value.toFixed(2)}h` : ""
                          }
                        />
                      </Bar>
                      <Bar dataKey="notes" fill="#C9FF3B" name="Notes">
                        <LabelList
                          dataKey="notes"
                          position="top"
                          formatter={(value) =>
                            typeof value === "number" ? `${value.toFixed(2)}h` : ""
                          }
                        />
                      </Bar>
                    </>
                  ) : (
                    <>
                      <Bar dataKey="duration" fill="#0D0F12" name="Duration">
                        <LabelList
                          dataKey="duration"
                          position="top"
                          formatter={(value) =>
                            typeof value === "number" ? `${value.toFixed(2)}h` : ""
                          }
                        />
                      </Bar>
                      <Bar dataKey="entries" fill="#C9FF3B" name={entryLabelShort}>
                        <LabelList
                          dataKey="entries"
                          position="top"
                          formatter={(value) =>
                            typeof value === "number" ? `${Math.round(value)}` : ""
                          }
                        />
                      </Bar>
                    </>
                  )}
                </BarChart>
              ) : chartType === "line" && lineData.length > 0 ? (
                <LineChart data={lineData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#d6d4cf"
                  />
                  <XAxis dataKey="date" stroke="#5a5f66" />
                  <YAxis stroke="#5a5f66" />
                  <Tooltip
                    formatter={(value: unknown) =>
                      typeof value === "number" ? `${value.toFixed(2)}h` : "0h"
                    }
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(13, 15, 18, 0.15)",
                      borderRadius: "10px",
                      color: "#0d0f12",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#5a5f66" }} />
                  {dataMode === "total" ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="Sessions"
                        stroke="#0D0F12"
                        strokeWidth={2}
                        dot={{ fill: "#0D0F12", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Notes"
                        stroke="#C9FF3B"
                        strokeWidth={2}
                        dot={{ fill: "#C9FF3B", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </>
                  ) : (
                    getFilteredTasks()
                      .filter((task) => getTaskDurationByMode(task) > 0)
                      .map((task, index) => (
                        <Line
                          key={task.id}
                          type="monotone"
                          dataKey={getTaskLabel(task)}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))
                  )}
                </LineChart>
              ) : null}
            </ResponsiveContainer>
          )}
        </div>

        {/* Tasks Summary Table */}
        {dataMode !== "notes" && tasks.length > 0 && (
          <div className="panel-surface p-6 overflow-x-auto">
            <h3 className="text-xl font-bold text-[color:var(--foreground)] mb-4">Tasks Summary</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(13,15,18,0.12)]">
                  <th className="text-left py-3 px-4 text-[color:var(--muted)] font-medium">
                    Task Name
                  </th>
                  <th className="text-right py-3 px-4 text-[color:var(--muted)] font-medium">
                    Duration
                  </th>
                  <th className="text-right py-3 px-4 text-[color:var(--muted)] font-medium">
                    {entryLabelShort}
                  </th>
                  <th className="text-right py-3 px-4 text-[color:var(--muted)] font-medium">
                    {avgLabel.replace("Avg ", "Avg/")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {getFilteredTasks()
                  .filter((task) => getTaskDurationByMode(task) > 0)
                  .sort(
                    (a, b) =>
                      getTaskDurationByMode(b) - getTaskDurationByMode(a)
                  )
                  .map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-[rgba(13,15,18,0.08)] table-row"
                    >
                      <td className="py-3 px-4 text-[color:var(--foreground)]">{task.name}</td>
                      <td className="py-3 px-4 text-right text-[color:var(--accent-strong)] font-medium clock-font tabular-nums">
                        {formatDuration(getTaskDurationByMode(task))}
                      </td>
                      <td className="py-3 px-4 text-right text-[color:var(--muted)]">
                        {getEntryCountByMode(task)}
                      </td>
                      <td className="py-3 px-4 text-right text-[color:var(--muted)] clock-font tabular-nums">
                        {formatDuration(
                          getEntryCountByMode(task) > 0
                            ? getTaskDurationByMode(task) / getEntryCountByMode(task)
                            : 0
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {dataMode === "notes" && notesSummary.length > 0 && (
          <div className="panel-surface p-6 overflow-x-auto">
            <h3 className="text-xl font-bold text-[color:var(--foreground)] mb-4">Notes Summary</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(13,15,18,0.12)]">
                  <th className="text-left py-3 px-4 text-[color:var(--muted)] font-medium">
                    Task
                  </th>
                  <th className="text-left py-3 px-4 text-[color:var(--muted)] font-medium">
                    Note
                  </th>
                  <th className="text-right py-3 px-4 text-[color:var(--muted)] font-medium">
                    Duration
                  </th>
                  <th className="text-right py-3 px-4 text-[color:var(--muted)] font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {notesSummary.map((note) => (
                  <tr
                    key={note.id}
                    className="border-b border-[rgba(13,15,18,0.08)] table-row"
                  >
                    <td className="py-3 px-4 text-[color:var(--foreground)]">
                      {note.taskName}
                    </td>
                    <td className="py-3 px-4 text-[color:var(--foreground)]">
                      {note.description}
                    </td>
                    <td className="py-3 px-4 text-right text-[color:var(--accent-strong)] font-medium clock-font tabular-nums">
                      {formatDuration(note.duration)}
                    </td>
                    <td className="py-3 px-4 text-right text-[color:var(--muted)]">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
