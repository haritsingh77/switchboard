const Phase = require("../models/Phase");

async function getAllPhases(req, res, next) {
  try {
    const phases = await Phase.find({ userId: req.userId });
    res.json(phases);
  } catch (err) {
    next(err);
  }
}

async function getPhaseById(req, res, next) {
  try {
    const phase = await Phase.findOne({ _id: req.params.id, userId: req.userId });
    if (!phase) {
      return res.status(404).json({ error: "Phase not found" });
    }
    res.json(phase);
  } catch (err) {
    next(err);
  }
}

async function createPhase(req, res, next) {
  try {
    const { roadmapId, name, startDate, endDate, order } = req.body;
    if (!roadmapId || !name) {
      return res.status(400).json({ error: "roadmapId and name are required" });
    }
    const phase = new Phase({ roadmapId, name, startDate, endDate, order, userId: req.userId });
    await phase.save();
    res.status(201).json(phase);
  } catch (err) {
    next(err);
  }
}

async function updatePhase(req, res, next) {
  try {
    const allowed = ["name", "startDate", "endDate", "order"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const phase = await Phase.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, {
      new: true,
      runValidators: true,
    });
    if (!phase) return res.status(404).json({ message: "Record not found" });
    res.status(200).json(phase);
  } catch (err) {
    next(err);
  }
}

async function deletePhase(req, res, next) {
  try {
    const removedPhase = await Phase.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (removedPhase === null) return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllPhases, getPhaseById, createPhase, updatePhase, deletePhase };
