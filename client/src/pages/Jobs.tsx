import { useState, useEffect } from "react";
import type { Job } from "../types";
import { apiFetch } from "../api";
import JobForm from "../features/jobs/JobForm";
import JobBoard from "../features/jobs/JobBoard";
import Funnel from "../components/Funnel";
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
    if (!window.confirm("Delete this application? This can't be undone.")) return;
    const prev = jobs;
    setJobs((cur) => cur.filter((job) => job._id !== id));
    try {
      await apiFetch(`/jobs/${id}`, { method: "DELETE" });
    } catch (err) {
      setJobs(prev);
      setError(err instanceof Error ? err.message : "Failed to delete job");
    }
  }

  async function updateJobStatus(id: string, status: Job["status"]) {
    const prev = jobs;
    // Optimistic move so the drag feels instant.
    setJobs((cur) => cur.map((job) => (job._id === id ? { ...job, status } : job)));
    try {
      const updated = await apiFetch(`/jobs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setJobs((cur) => cur.map((job) => (job._id === id ? updated : job)));
    } catch (err) {
      setJobs(prev);
      setError(err instanceof Error ? err.message : "Failed to update job");
    }
  }

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <div>
          <h1>Job Applications</h1>
          <p className="jobs-subtitle">Track your pipeline</p>
        </div>
        <button className="add-btn" onClick={() => setShowAddModal(true)}>
          + Add Application
        </button>
      </div>

      {error && <p className="jobs-error">{error}</p>}

      {loading ? (
        <p className="jobs-msg">Loading jobs...</p>
      ) : (
        <>
          <div className="jobs-funnel-card">
            <Funnel jobs={jobs} />
          </div>
          <JobBoard jobs={jobs} deleteJob={deleteJob} updateJobStatus={updateJobStatus} />
        </>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Application">
        <JobForm addJob={addJob} onDone={() => setShowAddModal(false)} />
      </Modal>
    </div>
  );
}

export default Jobs;
