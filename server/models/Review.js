const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    weekStart: { type: Date },
    weekEnd: { type: Date },
    body: { type: String },
    stats: {
      sessionsPlanned: {
        dsa: Number,
        build: Number,
        other: Number,
      },
      sessionsCompleted: {
        dsa: Number,
        build: Number,
        other: Number,
      },
      minutesStudied: Number,
      topicsCovered: [String],
      applicationsSent: Number,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Review", reviewSchema);
