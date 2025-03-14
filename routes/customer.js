import express from "express";
import multer from "multer";
import asyncHandler from "express-async-handler";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
import Customer from "../models/Customer.js";
import verifyToken from "../middleware/verifyToken.js";
import { sendEmail } from "../service/emailService.js";

dotenv.config();

const upload = multer({ storage: multer.memoryStorage(), limits: { fieldSize: 10 * 1024 * 1024 } });
const router = express.Router();

// 🛡️ Sanitize Input - Prevents script injection
const sanitizeInput = (req, res, next) => {
  for (const key in req.body) {
    if (typeof req.body[key] === "string") {
      req.body[key] = req.body[key].trim().replace(/[<>]/g, "").replace(/[^a-zA-Z0-9@._-\s]/g, "");
    }
  }
  next();
};

// 🔥 Generate Unique Call ID Efficiently
const generateUniqueCallId = async () => {
  let callId;
  let isUnique = false;
  
  while (!isUnique) {
    callId = `CALL-${Date.now().toString(36)}-${nanoid(6).toUpperCase()}`;
    isUnique = !(await Customer.exists({ callId }));
  }
  
  return callId;
};

// ✅ Create Customer
router.post("/create", upload.none(), sanitizeInput, asyncHandler(async (req, res) => {
  const { name, email, mobileNumber, pincode, message, address, type } = req.body;

  // 🚀 Improved Validation
  if (![name, email, mobileNumber, pincode, message, address, type].every(Boolean)) {
    return res.status(400).json({ status: "error", message: "All fields are required" });
  }
  
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ status: "error", message: "Invalid email format" });
  }
  
  if (!/^\d{10}$/.test(mobileNumber)) {
    return res.status(400).json({ status: "error", message: "Invalid mobile number" });
  }

  const callId = await generateUniqueCallId();
  const newCustomer = new Customer({
    callId, name, email, mobileNumber, pincode, message, address, type,
    status: 0, createdAt: new Date(), updatedAt: new Date()
  });

  const savedCustomer = await newCustomer.save();
  await sendEmail(savedCustomer);

  res.setHeader("Cache-Control", "no-store");
  res.status(201).json({ status: "success", message: "Customer created successfully", data: savedCustomer });
}));

// ✅ Get Number of Calls
router.get("/callsmeasure", verifyToken, asyncHandler(async (req, res) => {
  const statuses = [0, 1, 2, 3];
  const counts = await Promise.all(statuses.map(status => Customer.countDocuments({ type: "customer", status })));
  
  res.json({
    status: "success",
    data: { incoming: counts[0], ongoing: counts[1], pending: counts[2], closed: counts[3] }
  });
}));

// ✅ Get Customer Status
const getStatus = (status) => ({
  0: "Incoming",
  1: "Ongoing",
  2: "Pending",
  3: "Closed"
})[status] || "Cancel";

// ✅ Get Customers with Pagination
router.get("/", verifyToken, asyncHandler(async (req, res) => {
  
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const sortOrder = req.query.sort === "asc" ? 1 : -1
  const status = req.query.status ? parseInt(req.query.status, 10) : null;
  const query = { type: "customer", ...(status !== null && { status }) };
  
  const customers = await Customer.find(query)
    .sort({ createdAt: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  
  const total = await Customer.countDocuments(query);
  
  // ✅ Map Status Names
  const formattedCustomers = customers.map(customer => ({
    ...customer,
    status: getStatus(customer.status)
  }));


  
  // res.setHeader("Cache-Control", "public, max-age=3600");
  res.json({
    status: "success",
    data: formattedCustomers,
    pagination: { total, page, limit }
  });
}));

// ✅ Get Customer by Call ID
router.get("/:callId", verifyToken, asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ type: "customer", callId: req.params.callId }).lean();
  if (!customer) return res.status(404).json({ status: "error", message: "Customer not found" });

  res.json({ status: "success", data: customer });
}));

// ✅ Update Customer
router.patch("/update/:callId", verifyToken, sanitizeInput, asyncHandler(async (req, res) => {
  if (!Object.keys(req.body).length) {
    return res.status(400).json({ status: "error", message: "No update data provided" });
  }

  const updatedCustomer = await Customer.findOneAndUpdate(
    { type: "customer", callId: req.params.callId },
    { $set: { ...req.body, updatedAt: new Date() } },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedCustomer) return res.status(404).json({ status: "error", message: "Customer not found" });

  res.json({ status: "success", data: updatedCustomer });
}));

export default router;
