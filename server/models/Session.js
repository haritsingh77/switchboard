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

// Prevent double-booking the same slot. Track is part of the key so a morning
// DSA session and a morning Build session can legitimately coexist, matching the
// seed data and the Planner's own collision rule.
sessionSchema.index({ userId: 1, date: 1, slot: 1, track: 1 }, { unique: true });

module.exports = mongoose.model("Session", sessionSchema);
