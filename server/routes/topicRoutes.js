const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const {
  getAllTopics,
  getUnscheduledTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
} = require("../controllers/topicController");

router.use(requireAuth);
router.get("/", getAllTopics);
router.get("/unscheduled", getUnscheduledTopics);
router.get("/:id", getTopicById);
router.post("/", createTopic);
router.patch("/:id", updateTopic);
router.delete("/:id", deleteTopic);

module.exports = router;
