import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import cors from 'cors';

// Load environment variables from .env
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
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://shirazdev:Js2nlikYLU3ONnEF@cluster0.nt89p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

if (!MONGODB_URI) {
  throw new Error("⚠️ MongoDB URI is not defined in environment variables.");
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

app.use('/', (req, res) => {
  return res.status(200).json("Hello Service walah");
});

// Routes (use import syntax for modules)
import enquiryRoutes from './routes/enquiry.js';
import authRoutes from './routes/auth.js';

app.use('/api/v1/enquiry', enquiryRoutes);
app.use('/api/v1/auth', authRoutes);

// Start server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Use export default instead of module.exports
export default app;
