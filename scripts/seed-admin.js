require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in .env");
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "client", "employee"], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);

  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const name = process.env.ADMIN_NAME || "Admin";
  const password = process.env.ADMIN_PASSWORD || "";

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists:", email);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    name,
    email,
    passwordHash,
    role: "admin",
    isActive: true,
  });

  console.log("Admin seeded successfully:", email);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
