const User = require("../models/User");
const Roadmap = require("../models/Roadmap");
const Phase = require("../models/Phase");
const Topic = require("../models/Topic");
const Session = require("../models/Session");
const MiniCheck = require("../models/MiniCheck");
const FullMock = require("../models/FullMock");
const Review = require("../models/Review");
const Job = require("../models/Job");
const Study = require("../models/Study");

// Full account export — every collection scoped to the current user, so the
// user always owns a portable copy of their data. Password is never included.
async function getExport(req, res, next) {
  try {
    const userId = req.userId;
    const [user, roadmaps, phases, topics, sessions, miniChecks, fullMocks, reviews, jobs, study] =
      await Promise.all([
        User.findById(userId).select("email"),
        Roadmap.find({ userId }).lean(),
        Phase.find({ userId }).lean(),
        Topic.find({ userId }).lean(),
        Session.find({ userId }).sort({ date: 1 }).lean(),
        MiniCheck.find({ userId }).sort({ date: 1 }).lean(),
        FullMock.find({ userId }).sort({ date: 1 }).lean(),
        Review.find({ userId }).sort({ weekStart: 1 }).lean(),
        Job.find({ userId }).lean(),
        Study.find({ userId }).lean(),
      ]);

    res.json({
      exportedAt: new Date().toISOString(),
      user: user ? { email: user.email } : null,
      collections: { roadmaps, phases, topics, sessions, miniChecks, fullMocks, reviews, jobs, study },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getExport };
