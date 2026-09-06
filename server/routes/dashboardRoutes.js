const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const { getDashboardData } = require("../controllers/dashboardController");

router.use(requireAuth);
router.get("/", getDashboardData);

module.exports = router;
