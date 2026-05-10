/**
 * User Service Utilities
 * Handles user profile management, trial status, and history tracking
 */

export interface UserProfile {
  uid: string;
  email?: string;
  phone?: string;
  signupDate: number;
  isPremium: boolean;
  lastActivityDate: number;
  taskHistory: TaskEntry[];
}

export interface TaskEntry {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  duration?: number;
}

/**
 * Calculate days remaining in free trial
 * @param signupDate - Timestamp when user signed up
 * @returns Days remaining (0 if trial expired)
 */
export function getDaysRemainingInTrial(signupDate: number): number {
  const TRIAL_DAYS = 21;
  const daysSinceSignup = Math.floor((Date.now() - signupDate) / (1000 * 60 * 60 * 24));
  return Math.max(0, TRIAL_DAYS - daysSinceSignup);
}

/**
 * Check if user is in active trial period
 */
export function isInFreeTrial(signupDate: number): boolean {
  return getDaysRemainingInTrial(signupDate) > 0;
}

/**
 * Get trial status string for UI display
 */
export function getTrialStatusText(signupDate: number): string {
  const daysRemaining = getDaysRemainingInTrial(signupDate);
  if (daysRemaining === 0) {
    return "Trial expired • Upgrade to Premium";
  }
  return `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} free trial remaining`;
}

/**
 * Save user profile to localStorage (temporary solution)
 * TODO: Migrate to Firestore
 */
export function saveUserProfile(uid: string, profile: UserProfile): void {
  localStorage.setItem(`user_profile_${uid}`, JSON.stringify(profile));
}

/**
 * Load user profile from localStorage
 * TODO: Migrate to Firestore
 */
export function getUserProfile(uid: string): UserProfile | null {
  const stored = localStorage.getItem(`user_profile_${uid}`);
  return stored ? JSON.parse(stored) : null;
}

/**
 * Add task to user's history
 */
export function addTaskToHistory(
  profile: UserProfile,
  task: TaskEntry
): UserProfile {
  return {
    ...profile,
    taskHistory: [task, ...profile.taskHistory].slice(0, 100), // Keep last 100 tasks
  };
}

/**
 * Get tasks from the last N days
 */
export function getTasksFromLastDays(profile: UserProfile, days: number): TaskEntry[] {
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
  return profile.taskHistory.filter((task) => task.createdAt > cutoffTime);
}

/**
 * Calculate task completion rate
 */
export function getCompletionRate(tasks: TaskEntry[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

/**
 * Export user data for backup (GDPR compliance)
 */
export function exportUserData(profile: UserProfile): string {
  return JSON.stringify(profile, null, 2);
}

/**
 * Calculate time spent on tasks
 */
export function getTotalTimeSpent(tasks: TaskEntry[]): number {
  return tasks.reduce((sum, task) => sum + (task.duration || 0), 0);
}
