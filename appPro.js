import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import path from "path";
import { fileURLToPath } from "url";

// Configuration
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  },
  xssFilter: true,
  noSniff: true,
}));
app.use(compression());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); 
} else {
  app.use(morgan("combined"));
}

app.use(mongoSanitize());
app.use(hpp());

// Response Headers for SEO and Performance
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', 0);
    next();
  });
} else {
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });
}

// Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  dotfiles: "deny",
  maxAge: "31536000", // 1 year caching
  etag: true,
}));

// File Upload Configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images and PDFs are allowed"));
  }
});

// Body Parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

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

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.set('strictQuery', true);

mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 2,
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
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
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    error: "Not Found",
    message: `The requested resource ${req.originalUrl} was not found`,
    statusCode: 404,
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    status: "error",
    message: err.message || "Internal Server Error",
    statusCode,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(errorResponse);
});

// Process Handlers
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

process.on("unhandledRejection", (err) => {
  console.error("🚨 Unhandled Rejection:", err);
  gracefulShutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  console.error("🚨 Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Server Start
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Keep-alive timeout
server.keepAliveTimeout = 65000;
server.headersTimeout = 70000;

export default app;
