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

export interface Topic {
    _id: string;
    roadmapId?: string;
    phaseId?: string;
    name: string;
    status: "unscheduled" | "scheduled" | "completed";
    totalMinutes: number;
    lastStudiedAt?: string;
    revisionCount: number;
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
    status: "planned" | "completed" | "skipped";
    minutesSpent: number;
    notes?: string;
    topics: SessionTopic[];
    createdAt: string;
    updatedAt: string;
}
