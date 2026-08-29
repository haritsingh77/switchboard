const express = require("express");
const app = express();
app.use(express.json());
require("dotenv").config();
const mongoose = require("mongoose");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err.message));

app.get("/hello", (req, res) => {
  res.send({ message: "Hello", status: "ok" });
});

const Job = require("./models/Job");

app.get("/jobs", requireAuth, async (req, res, next) => {
  try {
    const jobs = await Job.find({ userId: req.userId });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

app.get("/jobs/:id", requireAuth, async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, userId: req.userId });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
});

app.post("/jobs", requireAuth, async (req, res, next) => {
  try {
    const { title, status, city } = req.body;
    if (!title || !status) {
      return res.status(400).json({ error: "title and status are required" });
    }
    const job = new Job({ title, status, city, userId: req.userId });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

app.patch("/jobs/:id", requireAuth, async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true });
    if (!job) return res.status(404).json({ message: "Record not found" });
    res.status(200).json(job);
  } catch (err) {
    next(err);
  }
});

app.delete("/jobs/:id", requireAuth, async (req, res, next) => {
  try {
    const deleteJob = await Job.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (deleteJob === null) return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    next(err);
  }
});

const User = require("./models/User");

app.post("/signup", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email or password is missing" });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    return res.status(201).json({ message: "User created succesfully" });
  } catch (err) {
    next(err);
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email or password is missing" });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.use((err, req, res, next) => {
  console.log(err.message);
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid id format" });
  }
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
