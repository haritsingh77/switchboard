const Roadmap = require("../models/Roadmap");
const Phase = require("../models/Phase");
const Topic = require("../models/Topic");
const Session = require("../models/Session");
const Job = require("../models/Job");

const DAY = 24 * 60 * 60 * 1000;
const REVISION_INTERVALS = [1, 3, 7, 14, 30];
const STREAK_WINDOW_DAYS = 90;

function isOverdue(topic, now) {
  if (!topic.lastStudiedAt) return false;
  const idx = Math.min(topic.revisionCount, REVISION_INTERVALS.length - 1);
  const intervalMs = REVISION_INTERVALS[idx] * DAY;
  return now - new Date(topic.lastStudiedAt) >= intervalMs;
}


async function getDashboardData(req, res, next) {
  try {
    const userId = req.userId;
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const streakCutoff = new Date(todayStart.getTime() - STREAK_WINDOW_DAYS * DAY);

    const roadmapDoc = await Roadmap.findOne({ userId, isActive: true });

    const [phaseDocs, roadmapTopics, allStudied, weekSessions, streakSessions, lastJob] = await Promise.all([
      roadmapDoc ? Phase.find({ userId, roadmapId: roadmapDoc._id }).sort({ order: 1 }) : Promise.resolve([]),
      roadmapDoc ? Topic.find({ userId, roadmapId: roadmapDoc._id }) : Promise.resolve([]),
      Topic.find({ userId, lastStudiedAt: { $ne: null } }).sort({ lastStudiedAt: 1 }),
      Session.find({ userId, date: { $gte: weekStart, $lt: weekEnd } }).sort({ date: 1 }),
      Session.find({ userId, status: "completed", date: { $gte: streakCutoff } }).select("date"),
      Job.findOne({ userId }).sort({ appliedDate: -1 }),
    ]);

    let roadmap = null;
    if (roadmapDoc) {
      const phaseData = phaseDocs.map((ph) => {
        const phaseTopics = roadmapTopics.filter((t) => String(t.phaseId) === String(ph._id));
        const done = phaseTopics.filter((t) => t.status === "completed").length;
        const completion = phaseTopics.length ? Math.round((done / phaseTopics.length) * 100) / 100 : 0;

        let status;
        if (completion >= 1) status = "completed";
        else if (ph.startDate && now < ph.startDate) status = "upcoming";
        else status = "active";

        let behindSchedule = false;
        if (ph.startDate && ph.endDate && completion < 1) {
          const total = new Date(ph.endDate) - new Date(ph.startDate);
          const elapsed = now - new Date(ph.startDate);
          const expected = Math.min(1, Math.max(0, elapsed / total));
          behindSchedule = completion < expected - 0.1;
        }

        return { name: ph.name, startDate: ph.startDate, endDate: ph.endDate, completion, status, behindSchedule };
      });

      const doneCount = roadmapTopics.filter((t) => t.status === "completed").length;
      const overallCompletion = roadmapTopics.length ? Math.round((doneCount / roadmapTopics.length) * 100) / 100 : 0;

      const weeksElapsed = Math.max(0, Math.floor((now - roadmapDoc.createdAt) / (7 * DAY)));
      const weeksRemaining = roadmapDoc.targetDate
        ? Math.max(0, Math.ceil((new Date(roadmapDoc.targetDate) - now) / (7 * DAY)))
        : 0;

      roadmap = {
        name: roadmapDoc.name,
        targetDate: roadmapDoc.targetDate,
        weeksElapsed,
        weeksRemaining,
        phases: phaseData,
        overallCompletion,
      };
    }

    const todaysSessions = weekSessions.filter((s) => s.date >= todayStart && s.date < todayEnd);

    const sessionsThisWeek = {
      completed: weekSessions.filter((s) => s.status === "completed").length,
      planned: weekSessions.length,
    };

    const lastAppliedAt = lastJob ? lastJob.appliedDate || lastJob.createdAt : null;
    const daysSinceLastApplication = lastAppliedAt ? Math.floor((now - new Date(lastAppliedAt)) / DAY) : null;

    const completedDays = new Set(
      streakSessions.map((s) => {
        const d = new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }),
    );
    let currentStreak = 0;
    const cursor = new Date(todayStart);
    while (completedDays.has(cursor.getTime())) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const dueTopics = allStudied.filter((t) => isOverdue(t, now));
    const dueForRevision = dueTopics.map((t) => ({
      topicId: t._id,
      name: t.name,
      lastStudiedAt: t.lastStudiedAt,
      revisionCount: t.revisionCount,
    }));

    const momentum = {
      daysSinceLastApplication,
      currentStreak,
      topicsOverdueCount: dueForRevision.length,
      sessionsThisWeek,
    };

    res.json({ roadmap, todaysSessions, momentum, dueForRevision });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboardData };
