export interface Roadmap {
    _id: string;
    name: string;
    goal?: string;
    targetDate?: string;
    isActive: boolean;
    status: "active" | "completed" | "archived";
    createdAt: string;
    updatedAt: string;
}

export interface Phase {
    _id: string;
    roadmapId: string;
    name: string;
    startDate?: string;
    endDate?: string;
    order?: number;
}

export type RevisionOutcome = "knew" | "kinda" | "forgot";

export interface TopicReview {
    date: string;
    outcome: RevisionOutcome;
}

export interface TopicResource {
    _id?: string;
    label?: string;
    url?: string;
}

export interface Topic {
    _id: string;
    roadmapId?: string;
    phaseId?: string;
    name: string;
    status: "unscheduled" | "scheduled" | "completed";
    totalMinutes: number;
    lastStudiedAt?: string;
    revisionCount: number;
    reviews?: TopicReview[];
    resources?: TopicResource[];
}

export interface SessionTopic {
    topicId?: string;
    name: string;
    completed: boolean;
    minutesSpent: number;
}

export interface Session {
    _id: string;
    date: string;
    slot: "morning" | "evening";
    track: "dsa" | "build" | "other";
    subjectId?: string | null;
    status: "planned" | "completed" | "skipped";
    plannedMinutes?: number;
    minutesSpent: number;
    startedAt?: string;
    focusRating?: number;
    notes?: string;
    topics: SessionTopic[];
    createdAt: string;
    updatedAt: string;
}
