export interface Study {
    _id: string;
    subject: string;
    duration: number;  // manually-entered baseline, minutes
    sessionMinutes?: number;  // minutes accrued from linked planner sessions
    topicsLeft: number;
    status: "not-started" | "in-progress" | "completed";
}
