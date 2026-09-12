export interface Reminder {
  _id: string;
  jobId?: string | null;
  title: string;
  dueDate: string;
  done: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
