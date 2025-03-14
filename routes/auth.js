import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../middleware/generateToken.js";
import verifyToken from "../middleware/verifyToken.js";
import validator from "validator";
import crypto from "crypto";

const router = express.Router();

// Middleware for input sanitization
const sanitizeInput = (req, res, next) => {
  for (const key in req.body) {
    if (typeof req.body[key] === "string") {
      req.body[key] = validator.trim(req.body[key]);
      req.body[key] = validator.escape(req.body[key]);
    }
  }
  next();
};

// Generate Unique User ID with better uniqueness
const generateUniqueUserId = async () => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(4).toString("hex").toUpperCase();
  const userId = `USER-${timestamp}-${randomStr}`;
  
  const exists = await User.findOne({ userId });
  if (exists) return generateUniqueUserId(); // Recurse if collision occurs
  return userId;
};

// REGISTER ROUTE
router.post("/register", sanitizeInput, async (req, res) => {
  const { username, mobile, email, password } = req.body;

  try {
    // Input validation
    if (!username || !mobile || !email || !password) {
      return res.status(400).json({
        status: "error",
        error: "Bad Request",
        message: "All fields (username, mobile, email, password) are required",
        statusCode: 400,
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        status: "error",
        error: "Bad Request",
        message: "Invalid email format",
        statusCode: 400,
      });
    }

    if (!validator.isMobilePhone(mobile, "any")) {
      return res.status(400).json({
        status: "error",
        error: "Bad Request",
        message: "Invalid mobile number format",
        statusCode: 400,
      });
    }

    if (!validator.isLength(password, { min: 8 })) {
      return res.status(400).json({
        status: "error",
        error: "Bad Request",
        message: "Password must be at least 8 characters long",
        statusCode: 400,
      });
    }

    // Check existing user
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({
        status: "error",
        error: "Conflict",
        message: "Email already registered",
        statusCode: 409,
      });
    }

    // Generate user ID and hash password
    const userId = await generateUniqueUserId();
    const salt = await bcrypt.genSalt(12); // Increased salt rounds
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      mobile,
      email,
      password: hashedPassword,
      userId,
      createdAt: new Date(),
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Set security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        userId: user.userId,
        email: user.email,
        token,
      },
      statusCode: 201,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: "An unexpected error occurred during registration",
      statusCode: 500,
    });
  }
});

// LOGIN ROUTE
router.post("/login", sanitizeInput, async (req, res) => {
  const { email, password } = req.body;

  try {
    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        error: "Bad Request",
        message: "Email and password are required",
        statusCode: 400,
      });
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        status: "error",
        error: "Unauthorized",
        message: "Invalid credentials",
        statusCode: 401,
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        error: "Unauthorized",
        message: "Invalid credentials",
        statusCode: 401,
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        token,
        userId: user.userId,
        username: user.username,
        email: user.email,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: "An unexpected error occurred during login",
      statusCode: 500,
    });
  }
});

// PROTECTED PROFILE ROUTE
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: "User profile not found",
        statusCode: 404,
      });
    }

    // Set cache headers for SEO
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.setHeader("Last-Modified", user.updatedAt.toUTCString());

    res.status(200).json({
      status: "success",
      message: "Profile retrieved successfully",
      data: user,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: "An unexpected error occurred while fetching profile",
      statusCode: 500,
    });
  }
});

// Handle invalid methods
router.all(["/register", "/login", "/profile"], (req, res) => {
  res.status(405).json({
    status: "error",
    error: "Method Not Allowed",
    message: `Method ${req.method} not allowed on this endpoint`,
    statusCode: 405,
  });
});

export default router;