const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const { getAllPhases, getPhaseById, createPhase, updatePhase, deletePhase } = require("../controllers/phaseController");

router.use(requireAuth);
router.get("/", getAllPhases);
router.get("/:id", getPhaseById);
router.post("/", createPhase);
router.patch("/:id", updatePhase);
router.delete("/:id", deletePhase);

module.exports = router;
