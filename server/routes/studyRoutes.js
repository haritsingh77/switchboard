const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/studyController.js");

router.use(requireAuth);
router.get("/", getAllSubjects);
router.get("/:id", getSubjectById);
router.post("/", createSubject);
router.patch("/:id", updateSubject);
router.delete("/:id", deleteSubject);

module.exports = router;
