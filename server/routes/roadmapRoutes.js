const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const {
  getAllRoadmaps,
  getRoadmapById,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
} = require("../controllers/roadmapController");

router.use(requireAuth);
router.get("/", getAllRoadmaps);
router.get("/:id", getRoadmapById);
router.post("/", createRoadmap);
router.patch("/:id", updateRoadmap);
router.delete("/:id", deleteRoadmap);

module.exports = router;
