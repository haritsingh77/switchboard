const mongoose = require("mongoose");

const fullMockSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    scores: {
      dsa: Number,
      concepts: Number,
      complexity: Number,
      architecture: Number,
    },
    notes: { type: String },
    // Structured, actionable feedback.
    feedback: {
      strengths: { type: [String], default: [] },
      gaps: { type: [String], default: [] },
      actionItems: { type: [String], default: [] },
    },
    // Roadmap topics this mock exercised / exposed as weak.
    topicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Topic" }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("FullMock", fullMockSchema);
