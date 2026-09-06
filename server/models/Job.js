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
