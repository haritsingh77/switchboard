export interface Study {
    _id: string;
    subject: string;
    duration: number;  //minutes
    topicsLeft: number;
    status: "not-started" | "in-progress" | "completed";
}
