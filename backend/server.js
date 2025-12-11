require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== MONGODB CONNECTION =====
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/assignment-tracker", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));

// ===== MODELS =====
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const assignmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  course: String,
  dueDate: String,
  priority: { type: String, default: "medium" },
  status: { type: String, default: "pending" },
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

const User = mongoose.model("User", userSchema);
const Assignment = mongoose.model("Assignment", assignmentSchema);

// ===== AUTH ROUTES =====
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password" });

    // Use user _id as token (for simplicity, in real apps use real JWT)
    const token = `token_${user._id}`;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: "All fields required" });

    let existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const newUser = new User({ username, email, password });
    await newUser.save();

    const token = `token_${newUser._id}`;
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { id: newUser._id, username: newUser.username, email: newUser.email }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// ===== AUTH CHECK MIDDLEWARE =====
const checkAuth = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "No token provided" });

  const parts = token.split("_");
  if (parts.length !== 2) return res.status(401).json({ error: "Invalid token format" });

  try {
    const userId = parts[1];
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "Invalid token user" });

    req.userId = user._id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// ===== ASSIGNMENT ROUTES =====
app.get("/api/assignments", checkAuth, async (req, res) => {
  try {
    const userAssignments = await Assignment.find({ userId: req.userId });
    res.json(userAssignments);
  } catch (err) {
    console.error("Fetch assignments error:", err);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

app.post("/api/assignments", checkAuth, async (req, res) => {
  try {
    const newAssignment = new Assignment({
      userId: req.userId,
      ...req.body
    });
    await newAssignment.save();
    res.status(201).json(newAssignment);
  } catch (err) {
    console.error("Create assignment error:", err);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

app.put("/api/assignments/:id", checkAuth, async (req, res) => {
  try {
    const updated = await Assignment.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Assignment not found" });
    res.json(updated);
  } catch (err) {
    console.error("Update assignment error:", err);
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

app.delete("/api/assignments/:id", checkAuth, async (req, res) => {
  try {
    const deleted = await Assignment.deleteOne({ _id: req.params.id, userId: req.userId });
    if (deleted.deletedCount === 0) return res.status(404).json({ error: "Assignment not found" });
    res.json({ message: "Assignment deleted successfully" });
  } catch (err) {
    console.error("Delete assignment error:", err);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

// ===== TEST ROUTES =====
app.get("/", (req, res) => res.send("HomeworkHub API - Manage your assignments efficiently"));

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("🚀 SERVER STARTED SUCCESSFULLY!");
  console.log(`📍 Port: ${PORT}`);
  console.log("📱 Frontend should be at: http://localhost:3000");
  console.log("=".repeat(50));
});
