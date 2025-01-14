const express = require("express");
const bcrypt = require("bcryptjs"); // ✅ For password hashing
const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const authMiddleware = require("../middleware/auth");
const crypto = require("crypto");
const router = express.Router();

// ✅ REGISTER ROUTE
router.post("/register", async (req, res) => {
  const { username, mobile, email, password } = req.body;

  try {
    // Validate input fields
    if (!username || !mobile || !email || !password) {
      return res.status(400).json({ message: "All fields are required", status: "error" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already in use", status: "error" });
    }

    // ✅ Generate a unique Employee ID
    let employeeId;
    let isUnique = false;

    while (!isUnique) {
      employeeId = `EMP-${crypto.randomBytes(3).toString("hex").toUpperCase()}`; // e.g., EMP-A1B2C3
      const idExists = await User.findOne({ employeeId });
      if (!idExists) {
        isUnique = true;
      }
    }

    // ✅ Hash the password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user with Employee ID
    const user = new User({
      username,
      mobile,
      email,
      password,
      employeeId,
    });

    // Save user to the database
    await user.save();

    // Generate JWT Token
    const token = generateToken(user._id);

    // Send response with token and Employee ID
    res.status(201).json({
      message: "User registered successfully",
      employeeId: user.employeeId,
      token,
      status: "success",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", status: "error" });
  }
});

// ✅ LOGIN ROUTE
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found", status: "error" });
    }

    // ✅ Check if the password is correct
    const isMatch = password === user.password ? true : false;
    
    if (!isMatch) {
      return res.status(400).json({ message: "Password invalid", status: "error" });
    }

    // Generate JWT Token
    const token = generateToken(user._id);

    // Send response with token
    res.status(200).json({
      message: "Login successful",
      token,
      employeeId: user.employeeId,
      username: user.username,
      email: user.email,
      status: "success",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", status: "error" });
  }
});

// ✅ PROTECTED ROUTE EXAMPLE
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

module.exports = router;
