const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    slot: { type: String, enum: ["morning", "evening"], required: true },
    track: { type: String, enum: ["dsa", "build", "other"], required: true },
    status: { type: String, enum: ["planned", "completed", "skipped"], default: "planned" },
    minutesSpent: { type: Number, default: 0 },
    notes: { type: String },
    topics: [
      {
        topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
        name: String,
        completed: { type: Boolean, default: false },
        minutesSpent: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Session", sessionSchema);
