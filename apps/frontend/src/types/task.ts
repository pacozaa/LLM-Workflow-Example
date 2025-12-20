export const TaskStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export interface Task {
  id: string;
  userInput: string;
  status: TaskStatus;
  aiResult: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}
