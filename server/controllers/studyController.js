const Study = require("../models/Study");

async function getAllSubjects(req, res, next) {
  try {
    const subjects = await Study.find({ userId: req.userId });
    res.json(subjects);
  } catch (err) {
    next(err);
  }
}

async function getSubjectById(req, res, next) {
  try {
    const subject = await Study.findOne({ _id: req.params.id, userId: req.userId });
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json(subject);
  } catch (err) {
    next(err);
  }
}

async function createSubject(req, res, next) {
  try {
    const { subject, duration, topicsLeft, status } = req.body;
    if (!subject || !duration || !topicsLeft) {
      return res.status(400).json({ error: "Subject, TopicsLeft and Duration are required" });
    }
    const subjectObj = new Study({ subject, duration, topicsLeft, status, userId: req.userId });
    await subjectObj.save();
    res.status(201).json(subjectObj);
  } catch (err) {
    next(err);
  }
}

async function updateSubject(req, res, next) {
  try {
    const subject = await Study.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ message: "Record not found" });
    res.status(200).json(subject);
  } catch (err) {
    next(err);
  }
}

async function deleteSubject(req, res, next) {
  try {
    const removedSubject = await Study.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (removedSubject === null) return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
};
