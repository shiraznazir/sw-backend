import express from "express";
import Brand from "../models/Brand.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const brand = new Brand(req.body);
    const savedBrand = await brand.save();
    res.status(201).json({
      status: "success",
      message: "Brand created successfully",
      data: savedBrand,
      statusCode: 201,
    });
  } catch (error) {
    if (error.message.includes("Duplicate")) {
      return res.status(409).json({
        status: "error",
        error: "Conflict",
        message: error.message,
        statusCode: 409,
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        status: "error",
        error: "Bad Request",
        message: Object.values(error.errors).map(e => e.message).join(", "),
        statusCode: 400,
      });
    }
    res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: "Failed to create brand",
      statusCode: 500,
    });
  }
});

router.get("/view", async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 }).lean();
    if (!brands.length) {
      return res.status(200).json({
        status: "success",
        message: "No brands found",
        data: [],
        statusCode: 200,
      });
    }
    const lastModified = Math.max(...brands.map(b => b.updatedAt.getTime()));
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Last-Modified", new Date(lastModified).toUTCString());
    res.status(200).json({
      status: "success",
      message: "Brands retrieved successfully",
      data: brands,
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: "Failed to fetch brands",
      statusCode: 500,
    });
  }
});

export default router;