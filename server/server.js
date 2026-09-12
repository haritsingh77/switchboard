require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());
const mongoose = require("mongoose");
const jobRoutes = require("./routes/jobRoutes");
const authRoutes = require("./routes/authRoutes");
const studyRoutes = require("./routes/studyRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const phaseRoutes = require("./routes/phaseRoutes");
const topicRoutes = require("./routes/topicRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const mockRoutes = require("./routes/mockRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const exportRoutes = require("./routes/exportRoutes");
const goalRoutes = require("./routes/goalRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const errorHandler = require("./middleware/errorHandler");
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err.message));

const cors = require("cors");
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:8080",
    process.env.CLIENT_URL,
  ].filter(Boolean),
}));

app.use("/jobs", jobRoutes);
app.use("/auth", authRoutes);
app.use("/study", studyRoutes);
app.use("/roadmaps", roadmapRoutes);
app.use("/phases", phaseRoutes);
app.use("/topics", topicRoutes);
app.use("/sessions", sessionRoutes);
app.use("/mocks", mockRoutes);
app.use("/reviews", reviewRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/export", exportRoutes);
app.use("/goals", goalRoutes);
app.use("/reminders", reminderRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
