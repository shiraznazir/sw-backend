import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import authMiddleware from '../middleware/auth.js';
import crypto from 'crypto';
import validator from 'validator';

const router = express.Router();

// ✅ Helper: Generate Unique Employee ID
const generateUniqueEmployeeId = async () => {
  let employeeId;
  let exists = true;
  employeeId = `EMP-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  // while (exists) {
  //   // Combines timestamp with random hex string for uniqueness
  //   employeeId = `EMP-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  //   exists = await User.findOne({ employeeId });
  // }

  return employeeId;
};

// ✅ REGISTER ROUTE
router.post("/register", async (req, res) => {
  console.log("API hit for registration");

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
    // const userExists = await User.findOne({ email });

    // if (userExists) {
    //   return res.status(400).json({ message: "Email already in use", status: "error" });
    // }

    // ✅ Generate a truly unique Employee ID
    const employeeId = await generateUniqueEmployeeId();

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user
    const user = new User({
      username,
      mobile,
      email,
      password: hashedPassword,
      employeeId,
    });

    // ✅ Save user to the database
    await user.save();

    // ✅ Generate JWT Token
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      employeeId: user.employeeId,
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
      employeeId: user.employeeId,
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
router.get("/profile", authMiddleware, async (req, res) => {
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
