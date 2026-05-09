export type ProgressIssueLevel = "warn" | "error";

export type ProgressIssueCode =
  | "duplicate-task-name"
  | "missing-task-id"
  | "missing-task-name"
  | "missing-notes-array"
  | "missing-sessions-array"
  | "invalid-session-duration"
  | "invalid-note-duration"
  | "invalid-session-range"
  | "invalid-session-timestamp"
  | "invalid-note-timestamp"
  | "running-task-missing-start";

export interface ProgressIssue {
  code: ProgressIssueCode;
  level: ProgressIssueLevel;
  message: string;
  taskId?: string;
  taskName?: string;
}

interface TaskLike {
  id?: string;
  name?: string;
  sessions?: Array<{
    startTime?: number;
    endTime?: number | null;
    duration?: number;
  }>;
  notes?: Array<{
    createdAt?: number;
    duration?: number;
  }>;
  isRunning?: boolean;
  currentSessionStart?: number | null;
}

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

export const getProgressDiagnostics = (tasks: TaskLike[]): ProgressIssue[] => {
  const issues: ProgressIssue[] = [];
  const nameMap = new Map<string, string[]>();

  tasks.forEach((task, index) => {
    const taskId = typeof task.id === "string" ? task.id : "";
    const taskName = typeof task.name === "string" ? task.name.trim() : "";

    if (!taskId) {
      issues.push({
        code: "missing-task-id",
        level: "warn",
        message: "Task is missing an id.",
        taskName,
      });
    }

    if (!taskName) {
      issues.push({
        code: "missing-task-name",
        level: "warn",
        message: "Task is missing a name.",
        taskId,
      });
    }

    if (taskName) {
      const existing = nameMap.get(taskName) ?? [];
      existing.push(taskId || `index-${index}`);
      nameMap.set(taskName, existing);
    }

    if (!Array.isArray(task.sessions)) {
      issues.push({
        code: "missing-sessions-array",
        level: "warn",
        message: "Task sessions are missing or invalid.",
        taskId,
        taskName,
      });
    } else {
      task.sessions.forEach((session) => {
        if (!isFiniteNumber(session.duration) || session.duration < 0) {
          issues.push({
            code: "invalid-session-duration",
            level: "warn",
            message: "Session duration is invalid.",
            taskId,
            taskName,
          });
        }

        if (!isFiniteNumber(session.startTime)) {
          issues.push({
            code: "invalid-session-timestamp",
            level: "warn",
            message: "Session start time is invalid.",
            taskId,
            taskName,
          });
        }

        if (session.endTime !== null && session.endTime !== undefined) {
          if (!isFiniteNumber(session.endTime)) {
            issues.push({
              code: "invalid-session-timestamp",
              level: "warn",
              message: "Session end time is invalid.",
              taskId,
              taskName,
            });
          } else if (isFiniteNumber(session.startTime) && session.endTime < session.startTime) {
            issues.push({
              code: "invalid-session-range",
              level: "warn",
              message: "Session end time is before start time.",
              taskId,
              taskName,
            });
          }
        }
      });
    }

    if (!Array.isArray(task.notes)) {
      issues.push({
        code: "missing-notes-array",
        level: "warn",
        message: "Task notes are missing or invalid.",
        taskId,
        taskName,
      });
    } else {
      task.notes.forEach((note) => {
        if (!isFiniteNumber(note.duration) || note.duration < 0) {
          issues.push({
            code: "invalid-note-duration",
            level: "warn",
            message: "Note duration is invalid.",
            taskId,
            taskName,
          });
        }

        if (!isFiniteNumber(note.createdAt)) {
          issues.push({
            code: "invalid-note-timestamp",
            level: "warn",
            message: "Note timestamp is invalid.",
            taskId,
            taskName,
          });
        }
      });
    }

    if (task.isRunning && !isFiniteNumber(task.currentSessionStart)) {
      issues.push({
        code: "running-task-missing-start",
        level: "warn",
        message: "Task is running without a valid start timestamp.",
        taskId,
        taskName,
      });
    }
  });

  nameMap.forEach((ids, name) => {
    if (ids.length > 1) {
      issues.push({
        code: "duplicate-task-name",
        level: "warn",
        message: `Multiple tasks share the name "${name}". Chart series may merge.`,
      });
    }
  });

  return issues;
};
