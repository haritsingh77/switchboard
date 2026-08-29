require("dotenv").config();
const mongoose = require("mongoose");
const Job = require("./models/Job");
const User = require("./models/User");
const bcrypt = require("bcrypt");

const jobs = [
  { title: "Frontend Developer", status: "applied", city: "Pune" },
  { title: "Full Stack Engineer", status: "interviewing", city: "Bangalore" },
  { title: "React Developer", status: "applied", city: "Hyderabad" },
  { title: "MERN Stack Developer", status: "offer", city: "Remote" },
  { title: "Angular Developer", status: "rejected", city: "Noida" },
  { title: "Software Engineer II", status: "interviewing", city: "Gurgaon" },
  { title: "Node.js Backend Developer", status: "applied", city: "Mumbai" },
  { title: "Frontend Engineer", status: "rejected", city: "Chennai" },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  let user = await User.findOne({ email: "test@test.com" });
  if (!user) {
    const hashedPassword = await bcrypt.hash("test1234", 10);
    user = await User.create({ email: "test@test.com", password: hashedPassword });
    console.log("Test user created");
  } else {
    console.log("Test user already exists");
  }
  await Job.deleteMany({});
  const jobsWithUser = jobs.map((j) => ({ ...j, userId: user._id }));
  await Job.insertMany(jobsWithUser);
  console.log(`Inserted ${jobs.length} jobs`);
  await mongoose.disconnect();
}

seed();
