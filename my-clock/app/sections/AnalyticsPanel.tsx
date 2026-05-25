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
import jsPDF from "jspdf";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
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

interface AnalyticsPanelProps {
  tasks?: Task[];
}

type ChartType = "pie" | "bar" | "line";
type TimePeriod = "daily" | "weekly" | "monthly" | "all";
type DataMode = "sessions" | "notes" | "total";
type ExportFormat = "pdf" | "docx";

type ReportTable = {
  title: string;
  summary?: string;
  columns: string[];
  rows: string[][];
};

type BarChartDatum = {
  name: string;
  sessions: number;
  notes: number;
  duration: number;
  entries: number;
};

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
  const { user, userData } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [chartType, setChartType] = useState<ChartType>("pie");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [dataMode, setDataMode] = useState<DataMode>("sessions");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [isMounted, setIsMounted] = useState(false);
  const diagnosticsRef = useRef<string>("");
  const progressKey = user?.uid ?? userData?.uid ?? null;

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

    // Poll localStorage for changes (less frequently to reduce re-renders)
    const interval = setInterval(loadTasks, 1000);

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

  const formatHours = (hours: number): string => `${hours.toFixed(2)}h`;

  const getTimePeriodLabel = () => {
    if (timePeriod === "daily") return "Last 24 Hours";
    if (timePeriod === "weekly") return "Last 7 Days";
    if (timePeriod === "monthly") return "Last 30 Days";
    return "All Time";
  };

  const getDataModeLabel = () => {
    if (dataMode === "notes") return "Notes only";
    if (dataMode === "sessions") return "Sessions only";
    return "Sessions + Notes";
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
  const getBarChartData = (): BarChartDatum[] => {
    const filteredTasks = getFilteredTasks();
    if (dataMode === "total") {
      return filteredTasks
        .map((task) => {
          const sessions = formatToHours(getTaskSessionsDuration(task));
          const notes = formatToHours(getTaskNotesDuration(task));
          return {
            name: getTaskLabel(task),
            sessions,
            notes,
            duration: sessions + notes,
            entries: getEntryCountByMode(task),
          };
        })
        .filter((entry) => entry.sessions > 0 || entry.notes > 0)
        .sort((a, b) => b.sessions + b.notes - (a.sessions + a.notes));
    }
    if (dataMode === "notes") {
      return filteredTasks
        .flatMap((task) =>
          task.notes.map((note) => {
            const duration = formatToHours(note.duration);
            return {
              name: getNoteLabel(task, note),
              sessions: 0,
              notes: duration,
              duration,
              entries: 1,
            };
          })
        )
        .filter((entry) => entry.duration > 0)
        .sort((a, b) => b.duration - a.duration);
    }
    return filteredTasks
      .filter((task) => getTaskDurationByMode(task) > 0)
      .map((task) => {
        const duration = formatToHours(getTaskDurationByMode(task));
        return {
          name: getTaskLabel(task),
          sessions: duration,
          notes: 0,
          duration,
          entries: getEntryCountByMode(task),
        };
      })
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
        .map(({ key: _key, ...rest }) => rest);
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
      .map(({ key: _key, ...rest }) => rest);
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

  const buildPieTable = (pieData: Array<{ name: string; value: number }>): ReportTable => {
    const totalHours = pieData.reduce((sum, entry) => sum + entry.value, 0);
    const rows = [...pieData]
      .sort((a, b) => b.value - a.value)
      .map((entry) => {
        const percent = totalHours > 0 ? (entry.value / totalHours) * 100 : 0;
        return [entry.name, formatHours(entry.value), `${percent.toFixed(1)}%`];
      });

    const topItems = rows.slice(0, 3).map((row) => `${row[0]} (${row[2]})`).join(", ");
    const summary = totalHours > 0
      ? `Total: ${formatHours(totalHours)} across ${rows.length} segments. Top: ${topItems}.`
      : "No pie chart data available for the selected period.";

    return {
      title: "Pie Chart Analysis",
      summary,
      columns: ["Segment", "Hours", "Percent"],
      rows,
    };
  };

  const buildBarTable = (barData: BarChartDatum[]): ReportTable => {
    if (dataMode === "total") {
      const rows = barData.map((entry) => {
        const sessions = typeof entry.sessions === "number" ? entry.sessions : 0;
        const notes = typeof entry.notes === "number" ? entry.notes : 0;
        const total = sessions + notes;
        return [String(entry.name ?? ""), formatHours(sessions), formatHours(notes), formatHours(total)];
      });
      const summary = rows.length > 0
        ? `Top task: ${rows[0][0]} with ${rows[0][3]} total.`
        : "No bar chart data available for the selected period.";
      return {
        title: "Bar Chart Analysis",
        summary,
        columns: ["Task", "Sessions (h)", "Notes (h)", "Total (h)"],
        rows,
      };
    }

    if (dataMode === "notes") {
      const rows = barData.map((entry) => [String(entry.name ?? ""), formatHours(entry.duration)]);
      const summary = rows.length > 0
        ? `Longest note: ${rows[0][0]} at ${rows[0][1]}.`
        : "No bar chart data available for the selected period.";
      return {
        title: "Bar Chart Analysis",
        summary,
        columns: ["Note", "Duration (h)"],
        rows,
      };
    }

    const rows = barData.map((entry) => [
      String(entry.name ?? ""),
      formatHours(entry.duration),
      Math.round(entry.entries).toString(),
    ]);
    const summary = rows.length > 0
      ? `Top task: ${rows[0][0]} with ${rows[0][1]}.`
      : "No bar chart data available for the selected period.";
    return {
      title: "Bar Chart Analysis",
      summary,
      columns: ["Task", "Duration (h)", "Entries"],
      rows,
    };
  };

  const buildLineTable = (lineData: Array<Record<string, string | number>>): ReportTable => {
    if (lineData.length === 0) {
      return {
        title: "Line Chart Analysis",
        summary: "No line chart data available for the selected period.",
        columns: ["Date", "Total (h)"],
        rows: [],
      };
    }

    if (dataMode === "total") {
      const totals = lineData.map((entry) => {
        const sessions = typeof entry.Sessions === "number" ? entry.Sessions : 0;
        const notes = typeof entry.Notes === "number" ? entry.Notes : 0;
        return {
          date: String(entry.date ?? ""),
          sessions,
          notes,
          total: sessions + notes,
        };
      });
      const peak = totals.reduce((max, entry) => (entry.total > max.total ? entry : max), totals[0]);
      const rows = totals.map((entry) => [
        entry.date,
        formatHours(entry.sessions),
        formatHours(entry.notes),
        formatHours(entry.total),
      ]);
      return {
        title: "Line Chart Analysis",
        summary: `Peak day: ${peak.date} with ${formatHours(peak.total)} total.`,
        columns: ["Date", "Sessions (h)", "Notes (h)", "Total (h)"],
        rows,
      };
    }

    const totals = lineData.map((entry) => {
      const total = Object.entries(entry).reduce((sum, [key, value]) => {
        if (key === "date") return sum;
        if (typeof value !== "number") return sum;
        return sum + value;
      }, 0);
      return { date: String(entry.date ?? ""), total };
    });
    const peak = totals.reduce((max, entry) => (entry.total > max.total ? entry : max), totals[0]);
    const rows = totals.map((entry) => [entry.date, formatHours(entry.total)]);
    return {
      title: "Line Chart Analysis",
      summary: `Peak day: ${peak.date} with ${formatHours(peak.total)} total.`,
      columns: ["Date", "Total (h)"],
      rows,
    };
  };

  const renderPdfTable = (pdf: jsPDF, table: ReportTable, startY: number): number => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 40;
    const marginTop = 40;
    const marginBottom = 40;
    const lineHeight = 12;
    const paddingX = 4;
    const paddingY = 3;
    const availableWidth = pageWidth - marginX * 2;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    let colWidths = table.columns.map((column, index) => {
      const headerWidth = pdf.getTextWidth(column);
      const maxCellWidth = table.rows.reduce((max, row) => {
        const cell = row[index] || "";
        const width = pdf.getTextWidth(cell);
        return Math.max(max, width);
      }, headerWidth);
      return maxCellWidth + paddingX * 2;
    });

    const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
    if (totalWidth > availableWidth) {
      const scale = availableWidth / totalWidth;
      colWidths = colWidths.map((width) => width * scale);
    }

    let y = startY;

    const renderRow = (cells: string[], isHeader: boolean) => {
      pdf.setFont("helvetica", isHeader ? "bold" : "normal");
      const lines: string[][] = cells.map((cell, index) =>
        pdf.splitTextToSize(cell || "", colWidths[index] - paddingX * 2) as string[]
      );
      const rowHeight =
        Math.max(...lines.map((line) => line.length)) * lineHeight + paddingY * 2;

      if (y + rowHeight > pageHeight - marginBottom) {
        pdf.addPage();
        y = marginTop;
      }

      let x = marginX;
      lines.forEach((cellLines: string[], index: number) => {
        pdf.rect(x, y, colWidths[index], rowHeight);
        const textStartY = y + paddingY + lineHeight - 2;
        cellLines.forEach((line: string, lineIndex: number) => {
          pdf.text(line, x + paddingX, textStartY + lineIndex * lineHeight);
        });
        x += colWidths[index];
      });
      y += rowHeight;
    };

    if (table.rows.length === 0) {
      if (y + lineHeight > pageHeight - marginBottom) {
        pdf.addPage();
        y = marginTop;
      }
      pdf.text("No data available.", marginX, y + lineHeight);
      return y + lineHeight + 12;
    }

    renderRow(table.columns, true);
    table.rows.forEach((row) => renderRow(row, false));

    return y + 18;
  };

  const handleExportReport = async () => {
    const stats = calculateStats();
    const pieData = getPieChartData();
    const barData = getBarChartData();
    const lineData = getLineChartData();
    const modeLabel = getDataModeLabel();
    const periodLabel = getTimePeriodLabel();
    const exportedAt = new Date();

    const summaryLines = [
      `Total time: ${formatDuration(stats.totalDuration)}`,
      `Total entries: ${stats.totalEntries}`,
      `Average per entry: ${formatDuration(stats.avgDurationPerEntry)}`,
      `Most productive task: ${stats.mostProductiveTask?.name || "N/A"}`,
      `Active tasks: ${stats.totalTasks}`,
    ];

    const tables: ReportTable[] = [
      buildPieTable(pieData),
      buildBarTable(barData),
      buildLineTable(lineData),
    ];

    const fileBase = `zoned-analytics-${exportedAt.toISOString().slice(0, 10)}`;

    if (exportFormat === "pdf") {
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      let cursorY = 40;

      pdf.setFontSize(18);
      pdf.text("Zoned Analytics Report", 40, cursorY);
      cursorY += 22;
      pdf.setFontSize(11);
      pdf.text(`Exported: ${exportedAt.toLocaleString()}`, 40, cursorY);
      cursorY += 14;
      pdf.text(`Mode: ${modeLabel} | Period: ${periodLabel}`, 40, cursorY);
      cursorY += 18;

      pdf.setFontSize(13);
      pdf.text("Summary", 40, cursorY);
      cursorY += 12;
      pdf.setFontSize(10);
      summaryLines.forEach((line) => {
        pdf.text(line, 50, cursorY);
        cursorY += 12;
      });
      cursorY += 8;

      tables.forEach((table) => {
        const pageHeight = pdf.internal.pageSize.getHeight();
        if (cursorY + 40 > pageHeight - 40) {
          pdf.addPage();
          cursorY = 40;
        }
        pdf.setFontSize(13);
        pdf.text(table.title, 40, cursorY);
        cursorY += 12;
        if (table.summary) {
          pdf.setFontSize(10);
          pdf.text(table.summary, 50, cursorY);
          cursorY += 12;
        }
        cursorY = renderPdfTable(pdf, table, cursorY);
      });

      pdf.save(`${fileBase}.pdf`);
      return;
    }

    const docChildren: Array<Paragraph | Table> = [
      new Paragraph({
        text: "Zoned Analytics Report",
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        children: [
          new TextRun(`Exported: ${exportedAt.toLocaleString()}`),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun(`Mode: ${modeLabel} | Period: ${periodLabel}`),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }),
      ...summaryLines.map((line) => new Paragraph({ text: line })),
      new Paragraph({ text: "" }),
    ];

    tables.forEach((table) => {
      docChildren.push(
        new Paragraph({ text: table.title, heading: HeadingLevel.HEADING_2 })
      );
      if (table.summary) {
        docChildren.push(new Paragraph({ text: table.summary }));
      }
      const headerRow = new TableRow({
        children: table.columns.map(
          (column) =>
            new TableCell({
              children: [new Paragraph({ text: column })],
            })
        ),
      });
      const bodyRows = table.rows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) => new TableCell({ children: [new Paragraph({ text: cell })] })
            ),
          })
      );
      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...bodyRows],
        })
      );
      docChildren.push(new Paragraph({ text: "" }));
    });

    const reportDoc = new Document({
      sections: [
        {
          children: docChildren,
        },
      ],
    });

    const blob = await Packer.toBlob(reportDoc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileBase}.docx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isMounted) return null;

  const stats = calculateStats();
  const pieData = getPieChartData();
  const barData: BarChartDatum[] = getBarChartData();
  const lineData = getLineChartData();
  const lineSeriesKeys =
    dataMode === "total"
      ? ["Sessions", "Notes"]
      : Array.from(
          lineData.reduce((keys, entry) => {
            Object.keys(entry).forEach((key) => {
              if (key !== "date") {
                keys.add(key);
              }
            });
            return keys;
          }, new Set<string>())
        ).sort();
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
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
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
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                className="select-premium w-auto"
              >
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
              </select>
              <button
                onClick={handleExportReport}
                className="btn btn-primary px-4 py-2 text-xs uppercase tracking-[0.18em]"
              >
                Export Report
              </button>
            </div>
          </div>
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
                    formatter={(value) => {
                      if (typeof value !== "number") return "0s";
                      return formatDuration(value * 3600000);
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
                  <YAxis
                    yAxisId="duration"
                    stroke="#5a5f66"
                    tickFormatter={(value) => `${value}h`}
                  />
                  {dataMode !== "total" && (
                    <YAxis
                      yAxisId="entries"
                      orientation="right"
                      stroke="#5a5f66"
                      allowDecimals={false}
                    />
                  )}
                  <Tooltip
                    formatter={(value, _name, props) => {
                      if (typeof value !== "number") return "0";
                      const dataKey =
                        props && typeof props === "object" && "dataKey" in props
                          ? String(props.dataKey)
                          : "";
                      if (dataKey === "entries") return Math.round(value).toString();
                      return `${value.toFixed(2)}h`;
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
                      <Bar
                        dataKey="sessions"
                        yAxisId="duration"
                        fill="#0D0F12"
                        name="Sessions"
                      >
                        <LabelList
                          dataKey="sessions"
                          position="top"
                          formatter={(value) =>
                            typeof value === "number" ? `${value.toFixed(2)}h` : ""
                          }
                        />
                      </Bar>
                      <Bar
                        dataKey="notes"
                        yAxisId="duration"
                        fill="#C9FF3B"
                        name="Notes"
                      >
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
                      <Bar
                        dataKey="duration"
                        yAxisId="duration"
                        fill="#0D0F12"
                        name="Duration"
                      >
                        <LabelList
                          dataKey="duration"
                          position="top"
                          formatter={(value) =>
                            typeof value === "number" ? `${value.toFixed(2)}h` : ""
                          }
                        />
                      </Bar>
                      <Bar
                        dataKey="entries"
                        yAxisId="entries"
                        fill="#C9FF3B"
                        name={entryLabelShort}
                      >
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
                    lineSeriesKeys.map((seriesKey, index) => (
                      <Line
                        key={seriesKey}
                        type="monotone"
                        dataKey={seriesKey}
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
