require('dotenv').config();  // Load environment variables from .env
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');
import dotenv from "dotenv";


dotenv.config();

const app = express();

// Set up multer storage (memory storage for file uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("⚠️ MongoDB URI is not defined in environment variables.");
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

app.use('/', (req, res)=>{
  return res.status(200).json("Hello Service walah")
})

// Routes
app.use('/api/v1/enquiry', require('./routes/enquiry'));
app.use('/api/v1/auth', require('./routes/auth'));

// Start server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
