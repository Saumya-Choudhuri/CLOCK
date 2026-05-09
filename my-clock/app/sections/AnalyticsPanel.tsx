"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
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

const COLORS = [
  "#D9B46F",
  "#7CC4C4",
  "#F2A65A",
  "#E07A5F",
  "#A3B18A",
  "#6B8E8E",
  "#E4C1A1",
  "#B7C4CF",
  "#C89F9C",
  "#88BDBC",
];

export default function AnalyticsPanel({ tasks: initialTasks = [] }: AnalyticsPanelProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [chartType, setChartType] = useState<ChartType>("pie");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
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
  const calculateTaskDuration = (task: Task): number => {
    const sessionDuration = task.sessions.reduce((sum, session) => sum + session.duration, 0);
    const notesDuration = task.notes.reduce((sum, note) => sum + note.duration, 0);
    return sessionDuration + notesDuration;
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
    return Math.round((ms / 3600000) * 100) / 100;
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
    return filteredTasks
      .filter((task) => calculateTaskDuration(task) > 0)
      .map((task) => ({
        name: getTaskLabel(task),
        value: formatToHours(calculateTaskDuration(task)),
        duration: calculateTaskDuration(task),
      }));
  };

  // Prepare data for bar chart
  const getBarChartData = () => {
    const filteredTasks = getFilteredTasks();
    return filteredTasks
      .filter((task) => calculateTaskDuration(task) > 0)
      .map((task) => ({
        name: getTaskLabel(task),
        duration: formatToHours(calculateTaskDuration(task)),
        sessions: task.sessions.length,
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

    filteredTasks.forEach((task) => {
      const label = getTaskLabel(task);
      // Include sessions
      task.sessions.forEach((session) => {
        const dayMeta = formatDayKey(session.startTime);

        if (!dailyData[dayMeta.key]) {
          dailyData[dayMeta.key] = { label: dayMeta.label, values: {} };
        }

        dailyData[dayMeta.key].values[label] = (dailyData[dayMeta.key].values[label] || 0) + formatToHours(session.duration);
      });

      // Include notes
      task.notes.forEach((note) => {
        const dayMeta = formatDayKey(note.createdAt);

        if (!dailyData[dayMeta.key]) {
          dailyData[dayMeta.key] = { label: dayMeta.label, values: {} };
        }

        dailyData[dayMeta.key].values[label] = (dailyData[dayMeta.key].values[label] || 0) + formatToHours(note.duration);
      });
    });

    return Object.entries(dailyData)
      .map(([key, data]) => ({
        key,
        date: data.label,
        ...data.values,
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key, ...rest }) => rest);
  };

  // Calculate statistics
  const calculateStats = () => {
    const filteredTasks = getFilteredTasks();
    const totalDuration = filteredTasks.reduce(
      (sum, task) => sum + calculateTaskDuration(task),
      0
    );
    const totalSessions = filteredTasks.reduce(
      (sum, task) => sum + task.sessions.length,
      0
    );
    const avgDurationPerSession =
      totalSessions > 0 ? totalDuration / totalSessions : 0;
    const mostProductiveTask = filteredTasks.length > 0
      ? filteredTasks.reduce((max, task) =>
          calculateTaskDuration(task) > calculateTaskDuration(max) ? task : max
        )
      : null;

    return {
      totalDuration,
      totalSessions,
      avgDurationPerSession,
      mostProductiveTask,
      totalTasks: filteredTasks.filter((t) => calculateTaskDuration(t) > 0)
        .length,
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
      statistics: {
        totalDuration: formatDuration(stats.totalDuration),
        totalSessions: stats.totalSessions,
        avgDurationPerSession: formatDuration(stats.avgDurationPerSession),
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

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Insights</p>
            <h2 className="text-3xl md:text-4xl font-display text-white">Analytics Dashboard</h2>
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
            <div className="flex gap-2">
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
            <div className="text-2xl font-bold text-white mt-2 clock-font tabular-nums">
              {formatDuration(stats.totalDuration)}
            </div>
          </div>

          <div className="stat-card" data-tone="teal">
            <div className="text-[color:var(--muted)] text-sm font-medium">Total Sessions</div>
            <div className="text-2xl font-bold text-white mt-2 clock-font tabular-nums">
              {stats.totalSessions}
            </div>
          </div>

          <div className="stat-card" data-tone="sage">
            <div className="text-[color:var(--muted)] text-sm font-medium">Avg Duration</div>
            <div className="text-2xl font-bold text-white mt-2 clock-font tabular-nums">
              {formatDuration(stats.avgDurationPerSession)}
            </div>
          </div>

          <div className="stat-card" data-tone="clay">
            <div className="text-[color:var(--muted)] text-sm font-medium">Active Tasks</div>
            <div className="text-2xl font-bold text-white mt-2 clock-font tabular-nums">
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
        {stats.mostProductiveTask && (
          <div className="panel-surface p-4">
            <div className="text-[color:var(--muted)] text-sm font-medium">Most Productive Task</div>
            <div className="text-xl font-bold text-[color:var(--accent-strong)] mt-2">
              {stats.mostProductiveTask.name}
            </div>
            <div className="text-[color:var(--muted)] text-sm mt-1">
              {formatDuration(calculateTaskDuration(stats.mostProductiveTask))} spent
            </div>
          </div>
        )}

          {/* Chart Section */}
        <div className="panel-surface p-6">
          <h3 className="text-xl font-bold text-white mb-2">
            {chartType === "pie"
              ? "Time Distribution"
              : chartType === "bar"
                ? "Tasks by Duration"
                : "Daily Progress"}
          </h3>
          <p className="text-xs text-[color:var(--muted)] mb-6">
            Period: {timePeriod === "daily" ? "Last 24 Hours" : timePeriod === "weekly" ? "Last 7 Days" : timePeriod === "monthly" ? "Last 30 Days" : "All Time"} | 
            Tasks with data: {getFilteredTasks().filter((t) => calculateTaskDuration(t) > 0).length} | 
            Total sessions: {getFilteredTasks().reduce((sum, t) => sum + t.sessions.length, 0)} | 
            Total notes: {getFilteredTasks().reduce((sum, t) => sum + t.notes.length, 0)}
          </p>

          {pieData.length === 0 && barData.length === 0 && lineData.length === 0 ? (
            <div className="flex items-center justify-center h-80 text-[color:var(--muted)]">
              <div className="text-center">
                <p>No data available for the selected period</p>
                <p className="text-sm mt-2">Start tracking tasks to see analytics</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              {chartType === "pie" && pieData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(2)}h`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown) => typeof value === 'number' ? `${value.toFixed(2)}h` : '0h'}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(217, 180, 111, 0.35)",
                      borderRadius: "10px",
                      color: "#f7f2e9",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ color: "#a6adbf" }}
                  />
                </PieChart>
              ) : chartType === "bar" && barData.length > 0 ? (
                <BarChart data={barData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                  />
                  <XAxis dataKey="name" stroke="#a6adbf" />
                  <YAxis stroke="#a6adbf" />
                  <Tooltip
                    formatter={(value: unknown) => typeof value === 'number' ? `${value}h` : '0h'}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(217, 180, 111, 0.35)",
                      borderRadius: "10px",
                      color: "#f7f2e9",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#a6adbf" }} />
                  <Bar dataKey="duration" fill="#D9B46F" />
                  <Bar dataKey="sessions" fill="#7CC4C4" />
                </BarChart>
              ) : chartType === "line" && lineData.length > 0 ? (
                <LineChart data={lineData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                  />
                  <XAxis dataKey="date" stroke="#a6adbf" />
                  <YAxis stroke="#a6adbf" />
                  <Tooltip
                    formatter={(value: unknown) => typeof value === 'number' ? `${value}h` : '0h'}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(217, 180, 111, 0.35)",
                      borderRadius: "10px",
                      color: "#f7f2e9",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#a6adbf" }} />
                  {getFilteredTasks()
                    .filter((task) => calculateTaskDuration(task) > 0)
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
                    ))}
                </LineChart>
              ) : null}
            </ResponsiveContainer>
          )}
        </div>

        {/* Tasks Summary Table */}
        {tasks.length > 0 && (
          <div className="panel-surface p-6 overflow-x-auto">
            <h3 className="text-xl font-bold text-white mb-4">Tasks Summary</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(217,180,111,0.2)]">
                  <th className="text-left py-3 px-4 text-[color:var(--muted)] font-medium">
                    Task Name
                  </th>
                  <th className="text-right py-3 px-4 text-[color:var(--muted)] font-medium">
                    Duration
                  </th>
                  <th className="text-right py-3 px-4 text-[color:var(--muted)] font-medium">
                    Sessions
                  </th>
                  <th className="text-right py-3 px-4 text-[color:var(--muted)] font-medium">
                    Avg/Session
                  </th>
                </tr>
              </thead>
              <tbody>
                {getFilteredTasks()
                  .filter((task) => calculateTaskDuration(task) > 0)
                  .sort(
                    (a, b) =>
                      calculateTaskDuration(b) - calculateTaskDuration(a)
                  )
                  .map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-[rgba(217,180,111,0.15)] table-row"
                    >
                      <td className="py-3 px-4 text-white">{task.name}</td>
                      <td className="py-3 px-4 text-right text-[color:var(--accent-strong)] font-medium clock-font tabular-nums">
                        {formatDuration(calculateTaskDuration(task))}
                      </td>
                      <td className="py-3 px-4 text-right text-[color:var(--muted)]">
                        {task.sessions.length}
                      </td>
                      <td className="py-3 px-4 text-right text-[color:var(--muted)] clock-font tabular-nums">
                        {formatDuration(
                          task.sessions.length > 0
                            ? calculateTaskDuration(task) / task.sessions.length
                            : 0
                        )}
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
