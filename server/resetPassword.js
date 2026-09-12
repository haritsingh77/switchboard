// One-off admin password reset. Run from the server dir:
//   node resetPassword.js <email>
// Prompts for the new password (masked) — nothing sensitive is passed as an arg.
require("dotenv").config({ path: "./.env", quiet: true });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const readline = require("readline");
const User = require("./models/User");

const email = process.argv[2];
if (!email) {
  console.error("Usage: node resetPassword.js <email>");
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let first = true;
    rl._writeToOutput = (str) => {
      if (first) {
        process.stdout.write(str); // print the prompt itself once
        first = false;
      } else {
        process.stdout.write("*"); // mask typed characters
      }
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }
  const pw = await askHidden(`New password for ${email}: `);
  if (!pw || pw.length < 6) {
    console.error("Password must be at least 6 characters. Nothing changed.");
    await mongoose.disconnect();
    process.exit(1);
  }
  user.password = await bcrypt.hash(pw, 10);
  await user.save();
  console.log(`\n✓ Password updated for ${email}. You can log in now.`);
  await mongoose.disconnect();
})();
