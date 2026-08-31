export interface Job {
    _id: string;
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
    topicsLeft: number;
    status: "not-started" | "in-progress" | "completed";
}

export interface LoginCredentials {
    email: string;
    password: string;
}