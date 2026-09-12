const mongoose = require("mongoose");

// One goal document per user, holding their weekly targets. Actuals are computed
// live against the current week in the dashboard aggregate.
const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    studyMinutesTarget: { type: Number, default: 600 }, // 10h / week
    applicationsTarget: { type: Number, default: 3 },
    mockTarget: { type: Number, default: 2 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Goal", goalSchema);
