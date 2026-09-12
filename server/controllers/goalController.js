const Goal = require("../models/Goal");

const DEFAULTS = { studyMinutesTarget: 600, applicationsTarget: 3, mockTarget: 2 };

async function getGoals(req, res, next) {
  try {
    const goal = await Goal.findOne({ userId: req.userId });
    res.json(goal || { ...DEFAULTS });
  } catch (err) {
    next(err);
  }
}

async function updateGoals(req, res, next) {
  try {
    const allowed = ["studyMinutesTarget", "applicationsTarget", "mockTarget"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = Math.max(0, Number(req.body[key]) || 0);
    }
    const goal = await Goal.findOneAndUpdate(
      { userId: req.userId },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.json(goal);
  } catch (err) {
    next(err);
  }
}

module.exports = { getGoals, updateGoals };
