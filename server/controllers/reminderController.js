const Reminder = require("../models/Reminder");

async function getReminders(req, res, next) {
  try {
    const filter = { userId: req.userId };
    if (req.query.jobId) filter.jobId = req.query.jobId;
    if (req.query.open === "true") filter.done = false;
    const reminders = await Reminder.find(filter).sort({ done: 1, dueDate: 1 });
    res.json(reminders);
  } catch (err) {
    next(err);
  }
}

async function createReminder(req, res, next) {
  try {
    const { title, dueDate, jobId, note } = req.body;
    if (!title || !dueDate) {
      return res.status(400).json({ error: "title and dueDate are required" });
    }
    const reminder = new Reminder({ title, dueDate, jobId: jobId || null, note, userId: req.userId });
    await reminder.save();
    res.status(201).json(reminder);
  } catch (err) {
    next(err);
  }
}

async function updateReminder(req, res, next) {
  try {
    const allowed = ["title", "dueDate", "done", "note"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const reminder = await Reminder.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, {
      new: true,
      runValidators: true,
    });
    if (!reminder) return res.status(404).json({ error: "Record not found" });
    res.status(200).json(reminder);
  } catch (err) {
    next(err);
  }
}

async function deleteReminder(req, res, next) {
  try {
    const removed = await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (removed === null) return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getReminders, createReminder, updateReminder, deleteReminder };
