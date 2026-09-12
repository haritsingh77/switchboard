const mongoose = require("mongoose");

// A follow-up / reminder, optionally tied to a job application.
const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    done: { type: Boolean, default: false },
    note: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Reminder", reminderSchema);
