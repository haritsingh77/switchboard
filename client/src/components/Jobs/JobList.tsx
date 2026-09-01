import { useState, useEffect } from "react";
import type { Job } from "../../types";
import { apiFetch } from "../../api";
import JobForm from "./JobForm";
import JobItem from "./JobItem";

function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        const data = await apiFetch("/jobs");
        setJobs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  async function addJob(jobData: Omit<Job, "_id">) {
    try {
      const created = await apiFetch("/jobs", {
        method: "POST",
        body: JSON.stringify(jobData),
      });
      setJobs((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add job");
    }
  }

  async function deleteJob(id: string) {
    try {
      await apiFetch(`/jobs/${id}`, { method: "DELETE" });
      setJobs((prev) => prev.filter((job) => job._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job");
    }
  }

  if (loading) return <p>Loading jobs...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <JobForm addJob={addJob} />
      {jobs.map((job) => (
        <JobItem key={job._id} job={job} deleteJob={deleteJob} />
      ))}
    </div>
  );
}

export default JobList;
