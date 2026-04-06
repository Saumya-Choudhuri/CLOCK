"use client";

import { useEffect, useState } from "react";
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
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
  "#F8B88B",
  "#A8E6CF",
];

export default function AnalyticsPanel({ tasks: initialTasks = [] }: AnalyticsPanelProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [chartType, setChartType] = useState<ChartType>("pie");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [isMounted, setIsMounted] = useState(false);

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
        name: task.name,
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
        name: task.name,
        duration: formatToHours(calculateTaskDuration(task)),
        sessions: task.sessions.length,
      }))
      .sort((a, b) => b.duration - a.duration);
  };

  // Prepare data for line chart (by day)
  const getLineChartData = () => {
    const filteredTasks = getFilteredTasks();
    const dailyData: Record<string, Record<string, number>> = {};

    filteredTasks.forEach((task) => {
      // Include sessions
      task.sessions.forEach((session) => {
        const date = new Date(session.startTime).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        if (!dailyData[date]) {
          dailyData[date] = {};
        }

        dailyData[date][task.name] = (dailyData[date][task.name] || 0) + formatToHours(session.duration);
      });

      // Include notes
      task.notes.forEach((note) => {
        const date = new Date(note.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        if (!dailyData[date]) {
          dailyData[date] = {};
        }

        dailyData[date][task.name] = (dailyData[date][task.name] || 0) + formatToHours(note.duration);
      });
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
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
    <div className="w-full h-full overflow-y-auto p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-bold text-white">Analytics Dashboard</h2>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-slate-800/50 backdrop-blur p-4 rounded-lg border border-slate-700">
            {/* Chart Type Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setChartType("pie")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  chartType === "pie"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                Pie Chart
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  chartType === "bar"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                Bar Chart
              </button>
              <button
                onClick={() => setChartType("line")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  chartType === "line"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
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
                className="px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 font-medium hover:bg-slate-600 transition-all"
              >
                <option value="daily">Last 24 Hours</option>
                <option value="weekly">Last 7 Days</option>
                <option value="monthly">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>

              {/* Export Button */}
              <button
                onClick={handleExportData}
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-all shadow-lg"
              >
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 border border-blue-700/30 rounded-lg p-4 backdrop-blur">
            <div className="text-slate-400 text-sm font-medium">Total Time</div>
            <div className="text-2xl font-bold text-blue-400 mt-2">
              {formatDuration(stats.totalDuration)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border border-purple-700/30 rounded-lg p-4 backdrop-blur">
            <div className="text-slate-400 text-sm font-medium">Total Sessions</div>
            <div className="text-2xl font-bold text-purple-400 mt-2">
              {stats.totalSessions}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 border border-green-700/30 rounded-lg p-4 backdrop-blur">
            <div className="text-slate-400 text-sm font-medium">Avg Duration</div>
            <div className="text-2xl font-bold text-green-400 mt-2">
              {formatDuration(stats.avgDurationPerSession)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/10 border border-orange-700/30 rounded-lg p-4 backdrop-blur">
            <div className="text-slate-400 text-sm font-medium">Active Tasks</div>
            <div className="text-2xl font-bold text-orange-400 mt-2">
              {stats.totalTasks}
            </div>
          </div>
        </div>

        {/* Most Productive Task */}
        {stats.mostProductiveTask && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm font-medium">Most Productive Task</div>
            <div className="text-xl font-bold text-amber-400 mt-2">
              {stats.mostProductiveTask.name}
            </div>
            <div className="text-slate-300 text-sm mt-1">
              {formatDuration(calculateTaskDuration(stats.mostProductiveTask))} spent
            </div>
          </div>
        )}

          {/* Chart Section */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-2">
            {chartType === "pie"
              ? "Time Distribution"
              : chartType === "bar"
                ? "Tasks by Duration"
                : "Daily Progress"}
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Period: {timePeriod === "daily" ? "Last 24 Hours" : timePeriod === "weekly" ? "Last 7 Days" : timePeriod === "monthly" ? "Last 30 Days" : "All Time"} | 
            Tasks with data: {getFilteredTasks().filter((t) => calculateTaskDuration(t) > 0).length} | 
            Total sessions: {getFilteredTasks().reduce((sum, t) => sum + t.sessions.length, 0)} | 
            Total notes: {getFilteredTasks().reduce((sum, t) => sum + t.notes.length, 0)}
          </p>

          {pieData.length === 0 && barData.length === 0 && lineData.length === 0 ? (
            <div className="flex items-center justify-center h-80 text-slate-400">
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
                    formatter={(value: number) => `${value.toFixed(2)}h`}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                  />
                </PieChart>
              ) : chartType === "bar" && barData.length > 0 ? (
                <BarChart data={barData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#475569"
                  />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    formatter={(value: number) => `${value}h`}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="duration" fill="#3b82f6" />
                  <Bar dataKey="sessions" fill="#8b5cf6" />
                </BarChart>
              ) : chartType === "line" && lineData.length > 0 ? (
                <LineChart data={lineData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#475569"
                  />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    formatter={(value: number) => `${value}h`}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Legend />
                  {getFilteredTasks()
                    .filter((task) => calculateTaskDuration(task) > 0)
                    .map((task, index) => (
                      <Line
                        key={task.id}
                        type="monotone"
                        dataKey={task.name}
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
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 overflow-x-auto">
            <h3 className="text-xl font-bold text-white mb-4">Tasks Summary</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Task Name
                  </th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">
                    Duration
                  </th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">
                    Sessions
                  </th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">
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
                      className="border-b border-slate-700 hover:bg-slate-700/30 transition-all"
                    >
                      <td className="py-3 px-4 text-slate-200">{task.name}</td>
                      <td className="py-3 px-4 text-right text-blue-400 font-medium">
                        {formatDuration(calculateTaskDuration(task))}
                      </td>
                      <td className="py-3 px-4 text-right text-purple-400">
                        {task.sessions.length}
                      </td>
                      <td className="py-3 px-4 text-right text-green-400">
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
