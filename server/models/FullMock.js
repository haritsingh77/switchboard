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
  },
  { timestamps: true },
);

module.exports = mongoose.model("FullMock", fullMockSchema);
