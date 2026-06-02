export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
  subTasks?: SubTask[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  quote: string;
  stars: number;
  initials: string;
  theme: 'dark' | 'light';
  avatarColor: string;
}

export interface SessionLog {
  id: string;
  durationSeconds: number;
  date: string;
  taskCount: number;
  type: 'Pomodoro' | 'Short Break' | 'Long Break' | 'Custom';
}
