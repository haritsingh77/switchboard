const mongoose = require("mongoose");

const miniCheckSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    items: [
      {
        topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
        topicName: { type: String },
        kind: { type: String, enum: ["problem", "definition"] },
        correct: { type: Boolean },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("MiniCheck", miniCheckSchema);
