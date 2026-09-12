export interface ReviewStats {
  sessionsPlanned?: { dsa: number; build: number; other: number };
  sessionsCompleted?: { dsa: number; build: number; other: number };
  minutesStudied?: number;
  topicsCovered?: string[];
  applicationsSent?: number;
}

export interface Review {
  _id: string;
  weekStart: string;
  weekEnd: string;
  body?: string;
  stats?: ReviewStats;
  createdAt: string;
  updatedAt: string;
}
