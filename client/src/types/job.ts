export interface Job {
    _id: string;
    title: string;
    company: string;
    appliedDate: string;
    status: "applied" | "interviewing" | "offer" | "rejected";
    package: number;
    city: string;
}
