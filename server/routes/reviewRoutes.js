const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

router.use(requireAuth);
router.get("/", getAllReviews);
router.get("/:id", getReviewById);
router.post("/", createReview);
router.patch("/:id", updateReview);
router.delete("/:id", deleteReview);

module.exports = router;
