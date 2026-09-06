const Roadmap = require("../models/Roadmap");
const Phase = require("../models/Phase");
const Topic = require("../models/Topic");

async function getAllRoadmaps(req, res, next) {
  try {
    const roadmaps = await Roadmap.find({ userId: req.userId });
    res.json(roadmaps);
  } catch (err) {
    next(err);
  }
}

async function getRoadmapById(req, res, next) {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.userId });
    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }
    res.json(roadmap);
  } catch (err) {
    next(err);
  }
}

async function createRoadmap(req, res, next) {
  try {
    const { name, goal, targetDate, isActive, status } = req.body;
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (isActive) {
      await Roadmap.updateMany({ userId: req.userId }, { isActive: false });
    }
    const roadmap = new Roadmap({ name, goal, targetDate, isActive, status, userId: req.userId });
    await roadmap.save();
    res.status(201).json(roadmap);
  } catch (err) {
    next(err);
  }
}

async function updateRoadmap(req, res, next) {
  try {
    const allowed = ["name", "goal", "targetDate", "isActive", "status"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.isActive === true) {
      await Roadmap.updateMany({ userId: req.userId }, { isActive: false });
    }
    const roadmap = await Roadmap.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, {
      new: true,
      runValidators: true,
    });
    if (!roadmap) return res.status(404).json({ message: "Record not found" });
    res.status(200).json(roadmap);
  } catch (err) {
    next(err);
  }
}

async function deleteRoadmap(req, res, next) {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.userId });
    if (!roadmap) return res.status(404).json({ error: "Record not found" });

    const studiedTopicCount = await Topic.countDocuments({
      userId: req.userId,
      roadmapId: roadmap._id,
      totalMinutes: { $gt: 0 },
    });

    if (studiedTopicCount > 0) {
      roadmap.status = "archived";
      roadmap.isActive = false;
      await roadmap.save();
      return res.status(200).json({ message: "Roadmap has studied topics; archived instead of deleted", roadmap });
    }

    await Topic.deleteMany({ userId: req.userId, roadmapId: roadmap._id });
    await Phase.deleteMany({ userId: req.userId, roadmapId: roadmap._id });
    await roadmap.deleteOne();
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllRoadmaps, getRoadmapById, createRoadmap, updateRoadmap, deleteRoadmap };
