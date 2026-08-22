import { useMemo } from "react";
import type { Job, Study } from "../../types";
import "./Overview.css";

interface OverviewProps {
  jobs: Job[];
  studies: Study[];
}
function Overview({ jobs, studies }: OverviewProps) {
  const summary = useMemo(() => {
    return {
      totalJobs: jobs.length,
      interviewCount: jobs.filter((job) => job.status === "interviewing")
        .length,
      totalSubjects: studies.length,
      inProgressCount: studies.filter((study) => study.status === "in-progress")
        .length,
      lessHoursSubjects: studies.filter((study) => study.duration < 60).length,
      leftToStartSubjects: studies.filter(
        (study) => study.status === "not-started",
      ).length,
    };
  }, [jobs, studies]);

  return (
    <div className="overview">
      <h1 className="overview-title">Overview</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-value">{summary.totalJobs}</p>
          <p className="stat-label">Total Jobs</p>
        </div>

        <div className="stat-card">
          <p className="stat-value">{summary.interviewCount}</p>
          <p className="stat-label">Interviews</p>
        </div>

        <div className="stat-card">
          <p className="stat-value">{summary.totalSubjects}</p>
          <p className="stat-label">Total Subjects</p>
        </div>

        <div className="stat-card">
          <p className="stat-value">{summary.inProgressCount}</p>
          <p className="stat-label">In Progress</p>
        </div>

        <div className="stat-card">
          <p className="stat-value">{summary.lessHoursSubjects}</p>
          <p className="stat-label">Under 60 Minutes</p>
        </div>

        <div className="stat-card">
          <p className="stat-value">{summary.leftToStartSubjects}</p>
          <p className="stat-label">Not Started</p>
        </div>
      </div>
    </div>
  );
}

export default Overview;
