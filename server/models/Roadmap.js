const mongoose = require("mongoose");

const roadmapSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    goal: { type: String },
    targetDate: { type: Date },
    isActive: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "completed", "archived"], default: "active" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Roadmap", roadmapSchema);
