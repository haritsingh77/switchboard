import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../api";
import type { Job, Study } from "../../types";
import "./Overview.css";

function Overview() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [subject, setSubject] = useState<Study[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [jobsData, studiesData] = await Promise.all([
          apiFetch("/jobs"),
          apiFetch("/study"),
        ]);
        setJobs(jobsData);
        setSubject(studiesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load overview");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const summary = useMemo(() => {
    return {
      totalJobs: jobs.length,
      interviewCount: jobs.filter((job) => job.status === "interviewing").length,
      totalSubjects: subject.length,
      inProgressCount: subject.filter((study) => study.status === "in-progress").length,
      lessHoursSubjects: subject.filter((study) => study.duration < 60).length,
      leftToStartSubjects: subject.filter((study) => study.status === "not-started").length,
    };
  }, [jobs, subject]);

  if (loading) return <p>Loading overview...</p>;
  if (error) return <p>{error}</p>;

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
