import express from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import Technician from "../models/Technician.js";
import path from "path";
import fs from "fs";
import verifyToken from "../middleware/verifyToken.js"; 
import { AREALIST } from "../constants.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadDir)); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${nanoid(6)}`;
    const ext = path.extname(file.originalname);
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
    cb(new Error("Invalid file type. Only jpeg, jpg, png, and webp are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, 
}).fields([
  { name: "front_image", maxCount: 1 },
  { name: "back_image", maxCount: 1 }, 
]);

// Helper function to generate a unique technician ID
async function generateUniqueTechnicianId() {
  let technicianId;
  let isUnique = false;

  while (!isUnique) {
    technicianId = `TECH-${nanoid(8).toUpperCase()}`;
    const existingTechnician = await Technician.findOne({ technicianId });
    if (!existingTechnician) {
      isUnique = true;
    }
  }
  return technicianId;
}

// Create a new technician
router.post("/create", verifyToken, upload, async (req, res) => {
  try {
    const { name, email, mobileNumber, address, id_proof, area } = req.body;

    if (!name || !email || !mobileNumber || !address || !id_proof || !area) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // if (!req.files || !req.files.front_image || !req.files.back_image) {
    //   return res.status(400).json({ message: "Both front and back images are required." });
    // }

    // const front_image = req.files.front_image[0].path;
    // const back_image = req.files.back_image[0].path;

    const technicianId = await generateUniqueTechnicianId();

    const newTechnician = new Technician({
      technicianId,
      name,
      email,
      mobileNumber,
      address,
      id_proof,
      // front_image,
      // back_image,
      area,
    });

    const savedTechnician = await newTechnician.save();
    res.status(201).json({
      message: "Technician added successfully",
      technician: savedTechnician,
      status: "success",
    });
  } catch (err) {
    console.error("Error saving technician:", err);
    res.status(500).json({ message: "Error saving technician data", error: err.message });
  }
});

// Helper function to find area label
const findArea = (param) => {
  const area = AREALIST.find(
    (item) => item.value === param || item.label.toLowerCase() === param?.toLowerCase()
  );
  return area ? area.label : "Unknown";
};

// ✅ GET all technician data
router.get("/view", verifyToken, async (req, res) => {
  try {
    const technicians = await Technician.find();

    const techniciansData = technicians.map((tech) => ({
      technicianId: tech.technicianId,
      name: tech.name,
      mobileNumber: tech.mobileNumber,
      email: tech.email,
      area: findArea(tech.area),
    }));

    res.status(200).json({
      technicians: techniciansData,
      status: true,
    });
  } catch (err) {
    console.error("Error fetching technicians data:", err);
    res.status(500).json({
      message: "Error fetching technicians data",
      error: err.message,
    });
  }
});

// ✅ GET technician data by technicianId
router.get("/view/:technicianId", verifyToken, async (req, res) => {
  try {
    const { technicianId } = req.params;
    const technician = await Technician.findOne({ technicianId });

    if (!technician) {
      return res.status(404).json({ message: "Technician not found", status: false });
    }

    res.status(200).json({ technician, status: "success" });
  } catch (err) {
    console.error(`Error fetching technician with ID ${technicianId}:`, err);
    res.status(500).json({ message: "Error fetching technician data", error: err.message });
  }
});

// ✅ Update technician data by technicianId
router.put("/update/:technicianId", verifyToken, async (req, res) => {
  try {
    const { technicianId } = req.params;
    const updatedData = req.body;
    
    const updatedTechnician = await Technician.findOneAndUpdate(
      { technicianId },
      updatedData,
      { new: true }
    );

    if (!updatedTechnician) {
      return res.status(404).json({ message: "Technician not found", status: false });
    }

    res.status(200).json({
      message: "Technician updated successfully",
      technician: updatedTechnician,
      status: "success",
    });
  } catch (err) {
    console.error("Error updating technician data:", err);
    res.status(500).json({
      message: "Error updating technician data",
      error: err.message,
    });
  }
});

export default router;
