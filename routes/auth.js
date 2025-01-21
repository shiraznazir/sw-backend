import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import generateToken from "../middleware/generateToken.js";
import verifyToken from '../middleware/verifyToken.js';
import validator from 'validator';
import crypto from 'crypto';

const router = express.Router();

// ✅ Helper: Generate Unique User ID
const generateUniqueUserId = async () => {
  let userId;
  let exists = true;
  while (exists) {
    userId = `USER-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const userExists = await User.findOne({ userId });
    if (!userExists) exists = false;
  }
  return userId;
};

// ✅ REGISTER ROUTE
router.post("/register", async (req, res) => {
  const { username, mobile, email, password } = req.body;

  try {
    // ✅ Input validation
    if (!username || !mobile || !email || !password) {
      return res.status(400).json({ message: "All fields are required", status: "error" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format", status: "error" });
    }

    // ✅ Check if the email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already in use", status: "error" });
    }

    // ✅ Generate a truly unique User ID
    const userId = await generateUniqueUserId();

    // ✅ Create new user
    const user = new User({
      username,
      mobile,
      email,
      password,
      userId,
    });

    // ✅ Save user to the database
    await user.save();

    // ✅ Generate JWT Token
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      userId: user.userId,
      token,
      status: "success",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", status: "error" });
  }
});

// ✅ LOGIN ROUTE
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found", status: "error" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password", status: "error" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: "Login successful",
      token,
      userId: user.userId,
      username: user.username,
      email: user.email,
      status: "success",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", status: "error" });
  }
});

// ✅ PROTECTED PROFILE ROUTE
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Profile fetched successfully", user, status: "success" });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error", status: "error" });
  }
});

export default router;
