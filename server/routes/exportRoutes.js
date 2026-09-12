const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const { getExport } = require("../controllers/exportController");

router.use(requireAuth);
router.get("/", getExport);

module.exports = router;
