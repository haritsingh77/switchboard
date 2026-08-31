const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  status: { type: String, required: true },
  city: { type: String, default: null },
  appliedDate: { type: String },
  package: { type: Number },
});

module.exports = mongoose.model("Job", jobSchema);
