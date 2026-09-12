const Topic = require("../models/Topic");
const Roadmap = require("../models/Roadmap");
const Phase = require("../models/Phase");
const Session = require("../models/Session");

const DAY = 24 * 60 * 60 * 1000;
const REVISION_INTERVALS = [1, 3, 7, 14, 30];

function dueMs(topic) {
  const idx = Math.min(topic.revisionCount, REVISION_INTERVALS.length - 1);
  return new Date(topic.lastStudiedAt).getTime() + REVISION_INTERVALS[idx] * DAY;
}

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
    const allowed = ["phaseId", "name", "status", "resources"];
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

// Adaptive spaced-repetition revise. Outcome adjusts the interval:
//   knew   → advance (revisionCount + 1, longer next gap)
//   kinda  → hold   (same interval)
//   forgot → reset  (relearn from the start)
// Always logs a review entry and resets the clock.
async function reviseTopic(req, res, next) {
  try {
    const outcome = ["knew", "kinda", "forgot"].includes(req.body.outcome) ? req.body.outcome : "knew";
    const topic = await Topic.findOne({ _id: req.params.id, userId: req.userId });
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    if (outcome === "knew") topic.revisionCount += 1;
    else if (outcome === "forgot") topic.revisionCount = 0;
    // "kinda" leaves revisionCount unchanged.

    topic.lastStudiedAt = new Date();
    topic.reviews.push({ date: new Date(), outcome });
    await topic.save();

    res.status(200).json(topic);
  } catch (err) {
    next(err);
  }
}

// The revision queue: topics past their spaced-repetition interval, most overdue first.
async function getDueTopics(req, res, next) {
  try {
    const now = Date.now();
    const studied = await Topic.find({ userId: req.userId, lastStudiedAt: { $ne: null } });
    const due = studied
      .filter((t) => now >= dueMs(t))
      .map((t) => ({
        topicId: t._id,
        name: t.name,
        phaseId: t.phaseId,
        lastStudiedAt: t.lastStudiedAt,
        revisionCount: t.revisionCount,
        daysOverdue: Math.floor((now - dueMs(t)) / DAY),
      }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
    res.json(due);
  } catch (err) {
    next(err);
  }
}

// All sessions in which this topic appears, newest first — powers the topic history view.
async function getTopicSessions(req, res, next) {
  try {
    const sessions = await Session.find({
      userId: req.userId,
      "topics.topicId": req.params.id,
    }).sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllTopics,
  getUnscheduledTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  reviseTopic,
  getTopicSessions,
  getDueTopics,
};
