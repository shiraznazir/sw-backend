import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import cors from "cors";
import helmet from 'helmet';

dotenv.config();

const app = express();

app.use('/uploads', express.static('uploads'));
app.use(helmet());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
  cors({
    origin: [
      "https://www.servicewalah.com",
      "https://servicewalah.com",
      "www.servicewalah.com",
      "http://localhost:3000",
      "http://localhost:8080",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: "Content-Type,Authorization",
  })
);


const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://shirazdev:Js2nlikYLU3ONnEF@cluster0.nt89p.mongodb.net/service-walah?retryWrites=true&w=majority&appName=Cluster0";

if (!MONGODB_URI) {
  throw new Error("⚠️ MongoDB URI is not defined in environment variables.");
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));


import authRoutes from "./routes/auth.js";
import customerRoutes from "./routes/customer.js";
import technicianRoutes from "./routes/technician.js";
import brandsRoutes from "./routes/brands.js";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/customer", customerRoutes);
app.use("/api/v1/technician", technicianRoutes);
app.use("/api/v1/brands", brandsRoutes);


// Start server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
