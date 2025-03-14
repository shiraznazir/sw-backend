import "dotenv/config";
import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable("x-powered-by"); // Hide framework information

// CORS Configuration
const allowedOrigins = [
    "https://www.servicewalah.com",
    "https://servicewalah.com",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:3001",
  ];
  
  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };


// Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  dotfiles: "deny",
  maxAge: "31536000",
  etag: true,
}));

// Body Parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// MongoDB Connection
mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 2,
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
import authRoutes from "./routes/auth.js";
import customerRoutes from "./routes/customer.js";
import technicianRoutes from "./routes/technician.js";
import brandsRoutes from "./routes/brands.js";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/customer", customerRoutes); 
app.use("/api/v1/technician", technicianRoutes);
app.use("/api/v1/brands", brandsRoutes);

// Health Check Endpoint
app.get("/health", (req, res) => res.status(200).json({ status: "success", message: "Server is healthy", timestamp: new Date().toISOString() }));

// 404 Handler
app.use((req, res) => res.status(404).json({ status: "error", error: "Not Found", message: `Resource ${req.originalUrl} not found`, statusCode: 404 }));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(err.statusCode || 500).json({ status: "error", message: err.message || "Internal Server Error", statusCode: err.statusCode || 500 });
});

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  console.log(`🛑 Received ${signal}. Shutting down...`);
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Shutdown error:", err);
    process.exit(1);
  }
};

["unhandledRejection", "uncaughtException", "SIGINT", "SIGTERM"].forEach(signal => process.on(signal, () => gracefulShutdown(signal)));

// Server Start
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

server.keepAliveTimeout = 65000;
server.headersTimeout = 70000;

export default app;
