const mongoose = require("mongoose");
const Session = require("../models/Session");
const Topic = require("../models/Topic");
const Study = require("../models/Study");

// Recompute a Study subject's session-tracked minutes as the sum of minutesSpent
// across every session linked to it. Called whenever a linked session's minutes
// or subject assignment changes, so the subject's studied total stays accurate.
async function recomputeSubjectMinutes(userId, subjectId) {
  if (!subjectId) return;
  const rows = await Session.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(String(userId)),
        subjectId: new mongoose.Types.ObjectId(String(subjectId)),
      },
    },
    { $group: { _id: "$subjectId", total: { $sum: "$minutesSpent" } } },
  ]);
  const total = rows.length ? rows[0].total : 0;
  await Study.updateOne({ _id: subjectId, userId }, { $set: { sessionMinutes: total } });
}

async function getSessions(req, res, next) {
  try {
    // Two query modes:
    //   ?from=ISO&to=ISO  → arbitrary date range (heatmaps, history, aggregation)
    //   ?weekStart=ISO    → the Mon–Sun week starting there (default: current week)
    let start;
    let end;

    if (req.query.from || req.query.to) {
      start = req.query.from ? new Date(req.query.from) : new Date(0);
      end = req.query.to ? new Date(req.query.to) : new Date();
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      if (req.query.weekStart) {
        start = new Date(req.query.weekStart);
      } else {
        start = new Date();
        const daysSinceMonday = (start.getDay() + 6) % 7;
        start.setDate(start.getDate() - daysSinceMonday);
      }
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }

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
      subjectId: s.subjectId || null,
      topics: s.topics,
      notes: s.notes,
      plannedMinutes: s.plannedMinutes || 0,
      userId: req.userId,
    }));
    let created;
    try {
      created = await Session.insertMany(docs, { ordered: true });
    } catch (err) {
      if (err && err.code === 11000) {
        return res
          .status(409)
          .json({ error: "One or more of those slots already has a session (same day, slot & track)." });
      }
      throw err;
    }
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

    const { notes, topics, focusRating, minutesSpent } = req.body;

    session.status = "completed";
    if (notes !== undefined) session.notes = notes;
    if (Array.isArray(topics)) session.topics = topics;
    if (focusRating !== undefined) {
      const r = Number(focusRating);
      session.focusRating = r >= 1 && r <= 5 ? r : undefined;
    }

    const sessionTopics = session.topics || [];
    const topicSum = sessionTopics.reduce((sum, t) => sum + (t.minutesSpent || 0), 0);
    // Prefer an explicit session total when provided (lets a session log time
    // without splitting it across topics); otherwise fall back to the topic sum.
    const explicit = Number(minutesSpent);
    session.minutesSpent = Number.isFinite(explicit) && explicit >= 0 ? explicit : topicSum;
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

    // Roll the session's minutes up into its linked subject's studied total.
    await recomputeSubjectMinutes(req.userId, session.subjectId);

    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
}

async function updateSession(req, res, next) {
  try {
    const allowed = ["date", "slot", "track", "subjectId", "notes", "plannedMinutes", "startedAt", "status"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    // Empty-string subjectId means "unassign".
    if (updates.subjectId === "") updates.subjectId = null;

    // Capture the prior subject so a reassignment can refresh both subjects' totals.
    const prev = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!prev) return res.status(404).json({ message: "Record not found" });

    let session;
    try {
      session = await Session.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, {
        new: true,
        runValidators: true,
      });
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({ error: "That day, slot & track already has a session." });
      }
      throw err;
    }
    if (!session) return res.status(404).json({ message: "Record not found" });

    // Keep affected subjects' studied totals in sync (old and/or new).
    if ("subjectId" in updates) {
      const before = prev.subjectId ? String(prev.subjectId) : null;
      const after = session.subjectId ? String(session.subjectId) : null;
      if (before && before !== after) await recomputeSubjectMinutes(req.userId, before);
      if (after) await recomputeSubjectMinutes(req.userId, after);
    }

    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
}

// Append a topic to an existing planned session (so one slot can hold several
// topics), and mark that topic scheduled. Idempotent per topicId.
async function addTopicToSession(req, res, next) {
  try {
    const { topicId, name } = req.body;
    if (!name && !topicId) return res.status(400).json({ error: "topicId or name is required" });
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const already = topicId && session.topics.some((t) => String(t.topicId) === String(topicId));
    if (!already) {
      session.topics.push({ topicId, name, completed: false, minutesSpent: 0 });
      await session.save();
      if (topicId) {
        await Topic.updateOne({ _id: topicId, userId: req.userId }, { status: "scheduled" });
      }
    }
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
}

async function deleteSession(req, res, next) {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ error: "Record not found" });

    const removedSubjectId = session.subjectId;
    await session.deleteOne();

    const topicIds = (session.topics || []).map((t) => t.topicId).filter(Boolean);
    if (topicIds.length > 0) {
      await Topic.updateMany(
        { _id: { $in: topicIds }, userId: req.userId, status: "scheduled" },
        { status: "unscheduled" },
      );
    }

    // Drop the deleted session's minutes from its subject's studied total.
    await recomputeSubjectMinutes(req.userId, removedSubjectId);

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSessions,
  createSessionsBulk,
  completeSession,
  updateSession,
  deleteSession,
  addTopicToSession,
};
