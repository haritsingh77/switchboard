const mongoose = require("mongoose");

const phaseSchema = new mongoose.Schema(
  {
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: "Roadmap", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    order: { type: Number },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Phase", phaseSchema);
