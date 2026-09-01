require("dotenv").config();
const mongoose = require("mongoose");
const Job = require("./models/Job");
const User = require("./models/User");
const bcrypt = require("bcrypt");

const jobs = [
  { title: "Frontend Developer", status: "applied", city: "Pune", appliedDate: "2026-08-05", package: 12 },
  { title: "Full Stack Engineer", status: "interviewing", city: "Bangalore", appliedDate: "2026-08-12", package: 18 },
  { title: "React Developer", status: "applied", city: "Hyderabad", appliedDate: "2026-08-18", package: 14 },
  { title: "MERN Stack Developer", status: "offer", city: "Remote", appliedDate: "2026-07-28", package: 22 },
  { title: "Angular Developer", status: "rejected", city: "Noida", appliedDate: "2026-07-15", package: 10 },
  { title: "Software Engineer II", status: "interviewing", city: "Gurgaon", appliedDate: "2026-08-20", package: 26 },
  { title: "Node.js Backend Developer", status: "applied", city: "Mumbai", appliedDate: "2026-08-22", package: 16 },
  { title: "Frontend Engineer", status: "rejected", city: "Chennai", appliedDate: "2026-07-10", package: 11 },
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
