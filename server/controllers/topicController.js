const Topic = require("../models/Topic");
const Roadmap = require("../models/Roadmap");
const Phase = require("../models/Phase");

async function getAllTopics(req, res, next) {
  try {
    const topics = await Topic.find({ userId: req.userId });
    res.json(topics);
  } catch (err) {
    next(err);
  }
}

async function getUnscheduledTopics(req, res, next) {
  try {
    const activeRoadmap = await Roadmap.findOne({ userId: req.userId, isActive: true });
    const roadmapMatch = [{ roadmapId: null }];
    if (activeRoadmap) roadmapMatch.push({ roadmapId: activeRoadmap._id });
    const topics = await Topic.find({ userId: req.userId, status: "unscheduled", $or: roadmapMatch });
    res.json(topics);
  } catch (err) {
    next(err);
  }
}

async function getTopicById(req, res, next) {
  try {
    const topic = await Topic.findOne({ _id: req.params.id, userId: req.userId });
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }
    res.json(topic);
  } catch (err) {
    next(err);
  }
}

async function createTopic(req, res, next) {
  try {
    const { phaseId, name, status, totalMinutes, lastStudiedAt, revisionCount } = req.body;
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    let roadmapId;
    if (phaseId) {
      const phase = await Phase.findOne({ _id: phaseId, userId: req.userId });
      if (!phase) {
        return res.status(400).json({ error: "Invalid phaseId" });
      }
      roadmapId = phase.roadmapId;
    }
    const topic = new Topic({ phaseId, roadmapId, name, status, totalMinutes, lastStudiedAt, revisionCount, userId: req.userId });
    await topic.save();
    res.status(201).json(topic);
  } catch (err) {
    next(err);
  }
}

async function updateTopic(req, res, next) {
  try {
    const allowed = ["phaseId", "name", "status"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.phaseId) {
      const phase = await Phase.findOne({ _id: updates.phaseId, userId: req.userId });
      if (!phase) return res.status(400).json({ error: "Invalid phaseId" });
      updates.roadmapId = phase.roadmapId;
    }
    const topic = await Topic.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, {
      new: true,
      runValidators: true,
    });
    if (!topic) return res.status(404).json({ message: "Record not found" });
    res.status(200).json(topic);
  } catch (err) {
    next(err);
  }
}

async function deleteTopic(req, res, next) {
  try {
    const removedTopic = await Topic.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (removedTopic === null) return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllTopics, getUnscheduledTopics, getTopicById, createTopic, updateTopic, deleteTopic };
