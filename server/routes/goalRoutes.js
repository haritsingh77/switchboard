const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const { getGoals, updateGoals } = require("../controllers/goalController");

router.use(requireAuth);
router.get("/", getGoals);
router.put("/", updateGoals);

module.exports = router;
