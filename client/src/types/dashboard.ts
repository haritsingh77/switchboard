import type { Session } from "./roadmap";
import type { Reminder } from "./reminder";

export interface DashboardPhase {
  name: string;
  startDate?: string;
  endDate?: string;
  completion: number; // 0..1
  status: "completed" | "active" | "upcoming";
  behindSchedule: boolean;
}

export interface DashboardRoadmap {
  name: string;
  targetDate?: string;
  weeksElapsed: number;
  weeksRemaining: number;
  phases: DashboardPhase[];
  overallCompletion: number; // 0..1
}

export interface DashboardMomentum {
  daysSinceLastApplication: number | null;
  currentStreak: number;
  topicsOverdueCount: number;
  sessionsThisWeek: { completed: number; skipped: number; planned: number };
}

export interface DueForRevision {
  topicId: string;
  name: string;
  lastStudiedAt?: string;
  revisionCount: number;
  phaseId?: string;
  daysOverdue?: number;
  reasons?: string[];
}

export interface Readiness {
  score: number;
  components: { roadmap: number; mocks: number; revision: number; applications: number };
}

export interface GoalTargets {
  studyMinutesTarget: number;
  applicationsTarget: number;
  mockTarget: number;
}

export interface DashboardGoals {
  targets: GoalTargets;
  actuals: { studyMinutes: number; applications: number; mocks: number };
}

export interface NextAction {
  id: string;
  text: string;
  severity: "danger" | "warning" | "info";
  link: string | null;
}

export interface DashboardData {
  roadmap: DashboardRoadmap | null;
  todaysSessions: Session[];
  momentum: DashboardMomentum;
  dueForRevision: DueForRevision[];
  goals: DashboardGoals;
  nextActions: NextAction[];
  readiness: Readiness;
  remindersDue: Reminder[];
}
