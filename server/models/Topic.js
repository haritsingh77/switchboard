const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    phaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Phase" },
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: "Roadmap" },
    name: { type: String, required: true },
    status: { type: String, enum: ["unscheduled", "scheduled", "completed"], default: "unscheduled" },
    totalMinutes: { type: Number, default: 0 },
    lastStudiedAt: { type: Date },
    revisionCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Topic", topicSchema);
