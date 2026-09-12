const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} = require("../controllers/reminderController");

router.use(requireAuth);
router.get("/", getReminders);
router.post("/", createReminder);
router.patch("/:id", updateReminder);
router.delete("/:id", deleteReminder);

module.exports = router;
