import { useState, useEffect } from "react";
import type { Job } from "../types";
import { apiFetch } from "../api";
import JobForm from "../features/jobs/JobForm";
import JobBoard from "../features/jobs/JobBoard";
import Modal from "../components/Modal";
import "./Job.css";

function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

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

  async function updateJobStatus(id: string, status: Job["status"]) {
    try {
      const updated = await apiFetch(`/jobs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setJobs((prev) => prev.map((job) => (job._id === id ? updated : job)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update job");
    }
  }

  if (loading) return <p>Loading jobs...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1>Job Applications</h1>
        <button className="add-btn" onClick={() => setShowAddModal(true)}>
          + Add Job
        </button>
      </div>
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Job">
        <JobForm addJob={addJob} onDone={() => setShowAddModal(false)} />
      </Modal>
      <JobBoard jobs={jobs} deleteJob={deleteJob} updateJobStatus={updateJobStatus} />
    </div>
  );
}

export default Jobs;
