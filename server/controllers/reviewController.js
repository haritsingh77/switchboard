const Review = require("../models/Review");

async function getAllReviews(req, res, next) {
  try {
    const reviews = await Review.find({ userId: req.userId }).sort({ weekStart: -1 });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

async function getReviewById(req, res, next) {
  try {
    const review = await Review.findOne({ _id: req.params.id, userId: req.userId });
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.json(review);
  } catch (err) {
    next(err);
  }
}

async function createReview(req, res, next) {
  try {
    const { weekStart, weekEnd, body, stats } = req.body;
    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: "weekStart and weekEnd are required" });
    }
    const review = new Review({ weekStart, weekEnd, body, stats, userId: req.userId });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

async function updateReview(req, res, next) {
  try {
    const allowed = ["weekStart", "weekEnd", "body", "stats"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const review = await Review.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, {
      new: true,
      runValidators: true,
    });
    if (!review) return res.status(404).json({ message: "Record not found" });
    res.status(200).json(review);
  } catch (err) {
    next(err);
  }
}

async function deleteReview(req, res, next) {
  try {
    const removedReview = await Review.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (removedReview === null) return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllReviews, getReviewById, createReview, updateReview, deleteReview };
