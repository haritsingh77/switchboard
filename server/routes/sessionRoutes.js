const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const {
  getSessions,
  createSessionsBulk,
  completeSession,
  updateSession,
  deleteSession,
  addTopicToSession,
} = require("../controllers/sessionController");

router.use(requireAuth);
router.get("/", getSessions);
router.post("/bulk", createSessionsBulk);
router.patch("/:id/complete", completeSession);
router.patch("/:id/add-topic", addTopicToSession);
router.patch("/:id", updateSession);
router.delete("/:id", deleteSession);

module.exports = router;
