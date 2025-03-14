import express from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import Technician from "../models/Technician.js";
import path from "path";
import fs from "fs/promises"; // Use promises API for async operations
import verifyToken from "../middleware/verifyToken.js";
import { AREALIST } from "../constants.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }
};

// Configure Multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now().toString(36)}-${nanoid(6)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, JPG, PNG, and WEBP files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 2, // Max 2 files
  },
}).fields([
  { name: "front_image", maxCount: 1 },
  { name: "back_image", maxCount: 1 },
]);

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  for (const key in req.body) {
    if (typeof req.body[key] === "string") {
      req.body[key] = req.body[key].trim();
      req.body[key] = req.body[key].replace(/[<>]/g, ""); // Basic XSS prevention
    }
  }
  next();
};

// Generate unique technician ID
async function generateUniqueTechnicianId() {
  const timestamp = Date.now().toString(36);
  const randomStr = nanoid(6).toUpperCase();
  const technicianId = `TECH-${timestamp}-${randomStr}`;

  if (await Technician.exists({ technicianId })) return generateUniqueTechnicianId();
  return technicianId;
}

// CREATE TECHNICIAN
router.post("/create", verifyToken, upload, sanitizeInput, async (req, res) => {
  try {
    const { name, email, mobileNumber, address, id_proof, area } = req.body;

    if (!name || !email || !mobileNumber || !address || !id_proof || !area) {
      return res.status(400).json({
        status: "error",
        error: "Bad Request",
        message: "All fields (name, email, mobileNumber, address, id_proof, area) are required",
        statusCode: 400,
      });
    }

    if (!req.files?.front_image?.[0] || !req.files?.back_image?.[0]) {
      return res.status(400).json({
        status: "error",
        error: "Bad Request",
        message: "Both front and back images are required",
        statusCode: 400,
      });
    }

    const front_image = path.relative(process.cwd(), req.files.front_image[0].path);
    const back_image = path.relative(process.cwd(), req.files.back_image[0].path);
    const technicianId = await generateUniqueTechnicianId();

    const newTechnician = new Technician({
      technicianId,
      name,
      email,
      mobileNumber,
      address,
      id_proof,
      front_image,
      back_image,
      area,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedTechnician = await newTechnician.save();

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(201).json({
      status: "success",
      message: "Technician created successfully",
      data: savedTechnician,
      statusCode: 201,
    });
  } catch (err) {
    console.error("Technician Creation Error:", err);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        status: "error",
        error: "Bad Request",
        message: `File upload error: ${err.message}`,
        statusCode: 400,
      });
    }
    res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: "Failed to create technician",
      statusCode: 500,
    });
  }
});

// GET ALL TECHNICIANS
router.get("/view", verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "desc" } = req.query;
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, Math.min(100, parseInt(limit))); // Cap at 100
    const sortOrder = sort === "asc" ? 1 : -1;

    const technicians = await Technician.find()
      .sort({ createdAt: sortOrder })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    const totalTechnicians = await Technician.countDocuments();

    if (!technicians.length) {
      return res.status(200).json({
        status: "success",
        message: "No technicians found",
        data: [],
        pagination: { total: 0, page: pageNumber, limit: limitNumber, totalPages: 0 },
        statusCode: 200,
      });
    }

    const techniciansData = technicians.map(tech => ({
      ...tech,
      area: findArea(tech.area),
    }));

    const lastModified = Math.max(...technicians.map(t => t.updatedAt.getTime()));
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Last-Modified", new Date(lastModified).toUTCString());
    res.setHeader("ETag", `W/"technicians-${technicians.length}-${lastModified}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");

    res.status(200).json({
      status: "success",
      message: "Technicians retrieved successfully",
      data: techniciansData,
      pagination: {
        total: totalTechnicians,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalTechnicians / limitNumber),
      },
      statusCode: 200,
    });
  } catch (err) {
    console.error("Technicians Fetch Error:", err);
    res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: "Failed to fetch technicians",
      statusCode: 500,
    });
  }
});

// GET TECHNICIAN BY ID
router.get("/view/:technicianId", verifyToken, async (req, res) => {
  try {
    const { technicianId } = req.params;
    const technician = await Technician.findOne({ technicianId }).lean();

    if (!technician) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: `Technician with ID ${technicianId} not found`,
        statusCode: 404,
      });
    }

    const technicianData = { ...technician, area: findArea(technician.area) };

    res.setHeader("Cache-Control", "private, max-age=3600");
    res.setHeader("Last-Modified", technician.updatedAt.toUTCString());
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(200).json({
      status: "success",
      message: "Technician retrieved successfully",
      data: technicianData,
      statusCode: 200,
    });
  } catch (err) {
    console.error(`Technician Fetch Error for ID ${req.params.technicianId}:`, err);
    res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: "Failed to fetch technician",
      statusCode: 500,
    });
  }
});

// UPDATE TECHNICIAN
router.put("/update/:technicianId", verifyToken, sanitizeInput, async (req, res) => {
  try {
    const { technicianId } = req.params;
    const updatedData = req.body;

    if (!Object.keys(updatedData).length) {
      return res.status(400).json({
        status: "error",
        error: "Bad Request",
        message: "No update data provided",
        statusCode: 400,
      });
    }

    const updatedTechnician = await Technician.findOneAndUpdate(
      { technicianId },
      { $set: { ...updatedData, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!updatedTechnician) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: `Technician with ID ${technicianId} not found`,
        statusCode: 404,
      });
    }

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(200).json({
      status: "success",
      message: "Technician updated successfully",
      data: updatedTechnician,
      statusCode: 200,
    });
  } catch (err) {
    console.error("Technician Update Error:", err);
    res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: "Failed to update technician",
      statusCode: 500,
    });
  }
});

// Method Not Allowed Handler
router.all(["/create", "/view", "/view/:technicianId", "/update/:technicianId"], (req, res) => {
  res.status(405).json({
    status: "error",
    error: "Method Not Allowed",
    message: `Method ${req.method} not allowed on this endpoint`,
    statusCode: 405,
  });
});

// Find area label
const findArea = (param) => {
  const area = AREALIST.find(
    item => item.value === param || item.label.toLowerCase() === param?.toLowerCase()
  );
  return area ? area.label : "Unknown";
};

export default router;