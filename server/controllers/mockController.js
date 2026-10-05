const MiniCheck = require("../models/MiniCheck");
const FullMock = require("../models/FullMock");

async function getMiniChecks(req, res, next) {
  try {
    const miniChecks = await MiniCheck.find({ userId: req.userId }).sort({ date: -1 });
    res.json(miniChecks);
  } catch (err) {
    next(err);
  }
}

async function createMiniCheck(req, res, next) {
  try {
    const { date, items, notes } = req.body;
    if (!date) {
      return res.status(400).json({ error: "date is required" });
    }
    const miniCheck = new MiniCheck({ date, items, notes, userId: req.userId });
    await miniCheck.save();
    res.status(201).json(miniCheck);
  } catch (err) {
    next(err);
  }
}

async function deleteMiniCheck(req, res, next) {
  try {
    const removed = await MiniCheck.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (removed === null) return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

async function getFullMocks(req, res, next) {
  try {
    const fullMocks = await FullMock.find({ userId: req.userId }).sort({ date: -1 });
    res.json(fullMocks);
  } catch (err) {
    next(err);
  }
}

async function createFullMock(req, res, next) {
  try {
    const { date, scores, notes, feedback, topicIds } = req.body;
    if (!date) {
      return res.status(400).json({ error: "date is required" });
    }
    const fullMock = new FullMock({ date, scores, notes, feedback, topicIds, userId: req.userId });
    await fullMock.save();
    res.status(201).json(fullMock);
  } catch (err) {
    next(err);
  }
}

async function deleteFullMock(req, res, next) {
  try {
    const removed = await FullMock.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (removed === null) return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

async function getTrend(req, res, next) {
  try {
    const [miniChecks, fullMocks] = await Promise.all([
      MiniCheck.find({ userId: req.userId }),
      FullMock.find({ userId: req.userId }),
    ]);
    const trend = [
      ...miniChecks.map((m) => ({ type: "miniCheck", date: m.date, data: m })),
      ...fullMocks.map((m) => ({ type: "fullMock", date: m.date, data: m })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(trend);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMiniChecks,
  createMiniCheck,
  deleteMiniCheck,
  getFullMocks,
  createFullMock,
  deleteFullMock,
  getTrend,
};
