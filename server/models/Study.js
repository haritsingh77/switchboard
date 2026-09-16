const mongoose = require("mongoose");

const studySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  // Manually-entered baseline of prior study time, in minutes.
  duration: { type: Number, required: true },
  // Minutes accrued from linked planner sessions, recomputed on the server.
  // Total studied time shown to the user is (duration + sessionMinutes).
  sessionMinutes: { type: Number, default: 0 },
  topicsLeft: { type: Number, required: true },
  status: { type: String, enum: ["not-started", "in-progress", "completed"], default: "not-started" },
  deletedAt: { type: Date, default: null },
});
module.exports = mongoose.model("Study", studySchema);
