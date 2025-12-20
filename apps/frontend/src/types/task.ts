export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface Task {
  id: string;
  userInput: string;
  status: TaskStatus;
  aiResult: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}
