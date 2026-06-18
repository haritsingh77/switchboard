export interface Job {
    id: number;
    title: string;
    appliedDate: string;
    status: "applied" | "interviewing" | "offer" | "rejected";
    package: number;
    city: string;
}

export interface Study {
    id: number;
    subject: string;
    duration: number;  //minutes
    topicsLeft: number
}