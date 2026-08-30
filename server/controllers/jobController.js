const Job = require("../models/Job");

async function getAllJobs(req, res, next) {
  try {
    const jobs = await Job.find({ userId: req.userId });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
}

async function getJobById(req, res, next) {
  try {
    const job = await Job.findOne({ _id: req.params.id, userId: req.userId });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
}

async function createJob(req, res, next) {
  try {
    const { title, status, city } = req.body;
    if (!title || !status) {
      return res.status(400).json({ error: "title and status are required" });
    }
    const job = new Job({ title, status, city, userId: req.userId });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
}

async function updateJob(req, res, next) {
  try {
    const job = await Job.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ message: "Record not found" });
    res.status(200).json(job);
  } catch (err) {
    next(err);
  }
}

async function deleteJob(req, res, next) {
  try {
    const removedJob = await Job.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (removedJob === null) return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllJobs, getJobById, createJob, updateJob, deleteJob };
