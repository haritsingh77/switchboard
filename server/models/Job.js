const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    status: { type: String, enum: ["applied", "interviewing", "offer", "rejected"], default: "applied" },
    city: { type: String, default: null },
    appliedDate: { type: Date },
    package: { type: Number },
    discussionNotes: { type: String },
    skillsGap: { type: [String] },
    needsTailoredResume: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    // Reason an application was rejected (a tag), for spotting patterns over time.
    rejectionReason: {
      type: String,
      enum: ["culture", "experience", "skill-gap", "compensation", "location", "ghosted", "other", null],
      default: null,
    },
    // Roadmap topics relevant to this role ("studied X for company Y").
    relevantTopicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Topic" }],
    // Interview pipeline within a single application.
    rounds: [
      {
        type: {
          type: String,
          enum: ["phone", "coding", "system-design", "behavioral", "hr", "onsite", "take-home", "other"],
          default: "other",
        },
        date: { type: Date },
        outcome: { type: String, enum: ["pending", "passed", "failed", "cancelled"], default: "pending" },
        notes: { type: String },
        score: { type: Number },
      },
    ],
    statusHistory: [
      {
        status: { type: String },
        date: { type: Date },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Job", jobSchema);
