require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());
const mongoose = require("mongoose");
const jobRoutes = require("./routes/jobRoutes");
const authRoutes = require("./routes/authRoutes");
const studyRoutes = require("./routes/studyRoutes");
const errorHandler = require("./middleware/errorHandler");
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err.message));

const cors = require("cors");
app.use(cors({ origin: ["http://localhost:5173" , "http://localhost:8080"] }));

app.use("/jobs", jobRoutes);
app.use("/auth", authRoutes);
app.use("/study", studyRoutes);
app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
