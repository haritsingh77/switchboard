const Session = require("../models/Session");
const Topic = require("../models/Topic");

async function getSessions(req, res, next) {
  try {
    let start;
    if (req.query.weekStart) {
      start = new Date(req.query.weekStart);
    } else {
      start = new Date();
      const daysSinceMonday = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - daysSinceMonday);
    }
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const sessions = await Session.find({
      userId: req.userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

async function createSessionsBulk(req, res, next) {
  try {
    const { sessions } = req.body;
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({ error: "sessions must be a non-empty array" });
    }
    const docs = sessions.map((s) => ({
      date: s.date,
      slot: s.slot,
      track: s.track,
      topics: s.topics,
      notes: s.notes,
      userId: req.userId,
    }));
    const created = await Session.insertMany(docs);
    const topicIds = sessions.flatMap((s) => (s.topics || []).map((t) => t.topicId)).filter(Boolean);
    if (topicIds.length > 0) {
      await Topic.updateMany({ _id: { $in: topicIds }, userId: req.userId }, { status: "scheduled" });
    }

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function completeSession(req, res, next) {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const { notes, topics } = req.body;

    session.status = "completed";
    if (notes !== undefined) session.notes = notes;
    if (Array.isArray(topics)) session.topics = topics;

    const sessionTopics = session.topics || [];
    session.minutesSpent = sessionTopics.reduce((sum, t) => sum + (t.minutesSpent || 0), 0);
    await session.save();

    const now = new Date();
    const topicUpdates = sessionTopics.map((t) =>
      Topic.updateOne(
        { _id: t.topicId, userId: req.userId },
        {
          $inc: { totalMinutes: t.minutesSpent || 0 },
          $set: { lastStudiedAt: now, status: t.completed ? "completed" : "unscheduled" },
        },
      ),
    );
    await Promise.all(topicUpdates);

    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
}

async function updateSession(req, res, next) {
  try {
    const allowed = ["date", "slot", "track", "notes"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const session = await Session.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, {
      new: true,
      runValidators: true,
    });
    if (!session) return res.status(404).json({ message: "Record not found" });
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
}

async function deleteSession(req, res, next) {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ error: "Record not found" });

    await session.deleteOne();

    const topicIds = (session.topics || []).map((t) => t.topicId).filter(Boolean);
    if (topicIds.length > 0) {
      await Topic.updateMany(
        { _id: { $in: topicIds }, userId: req.userId, status: "scheduled" },
        { status: "unscheduled" },
      );
    }

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSessions, createSessionsBulk, completeSession, updateSession, deleteSession };
