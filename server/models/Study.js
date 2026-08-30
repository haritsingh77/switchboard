const mongoose = require("mongoose");

const studySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  duration: { type: Number, required: true },
  topicsLeft: { type: Number, required: true },
  status: { type: String, enum: ["not-started", "in-progress", "completed"], default: "not-started" },
});
module.exports = mongoose.model("Study", studySchema);
