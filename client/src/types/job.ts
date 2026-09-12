export type RoundType =
  | "phone"
  | "coding"
  | "system-design"
  | "behavioral"
  | "hr"
  | "onsite"
  | "take-home"
  | "other";

export type RoundOutcome = "pending" | "passed" | "failed" | "cancelled";

export interface InterviewRound {
    _id?: string;
    type: RoundType;
    date?: string;
    outcome: RoundOutcome;
    notes?: string;
    score?: number;
}

export type RejectionReason =
    | "culture"
    | "experience"
    | "skill-gap"
    | "compensation"
    | "location"
    | "ghosted"
    | "other";

export interface Job {
    _id: string;
    title: string;
    company: string;
    appliedDate: string;
    status: "applied" | "interviewing" | "offer" | "rejected";
    package: number;
    city: string;
    needsTailoredResume?: boolean;
    discussionNotes?: string;
    skillsGap?: string[];
    rejectionReason?: RejectionReason | null;
    relevantTopicIds?: string[];
    rounds?: InterviewRound[];
    createdAt?: string;
    updatedAt?: string;
}
