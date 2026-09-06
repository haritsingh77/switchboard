const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const {
  getMiniChecks,
  createMiniCheck,
  deleteMiniCheck,
  getFullMocks,
  createFullMock,
  deleteFullMock,
  getTrend,
} = require("../controllers/mockController");

router.use(requireAuth);
router.get("/trend", getTrend);
router.get("/mini", getMiniChecks);
router.post("/mini", createMiniCheck);
router.delete("/mini/:id", deleteMiniCheck);
router.get("/full", getFullMocks);
router.post("/full", createFullMock);
router.delete("/full/:id", deleteFullMock);

module.exports = router;
