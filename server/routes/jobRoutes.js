const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const { getAllJobs, getJobById, createJob, updateJob, deleteJob } = require("../controllers/jobController");

router.use(requireAuth);
router.get("/", getAllJobs);
router.get("/:id", getJobById);
router.post("/", createJob);
router.patch("/:id", updateJob);
router.delete("/:id", deleteJob);

module.exports = router;
