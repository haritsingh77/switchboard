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
  reviseTopic,
  getTopicSessions,
  getDueTopics,
} = require("../controllers/topicController");

router.use(requireAuth);
router.get("/", getAllTopics);
router.get("/unscheduled", getUnscheduledTopics);
router.get("/due", getDueTopics);
router.get("/:id/sessions", getTopicSessions);
router.get("/:id", getTopicById);
router.post("/", createTopic);
router.patch("/:id/revise", reviseTopic);
router.patch("/:id", updateTopic);
router.delete("/:id", deleteTopic);

module.exports = router;
