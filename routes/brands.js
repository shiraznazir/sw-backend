import express from 'express';
import Brand from '../models/Brand.js';
import { nanoid } from 'nanoid';  
import verifyToken from '../middleware/verifyToken.js'; 

const router = express.Router();

// Helper function to generate a unique brand ID
async function generateBrandId() {
  let brandId;
  let isUnique = false;

  while (!isUnique) {
    brandId = `BRAND-${nanoid(8).toUpperCase()}`;  
    const existingBrand = await Brand.findOne({ brandId });  
    if (!existingBrand) {
      isUnique = true;
    }
  }
  return brandId;
}

// ✅ Create a new brand (with token verification)
router.post('/create', verifyToken, async (req, res) => { 
  const { brandName } = req.body;
  
  // Validation
  if (!brandName || typeof brandName !== 'string' || !brandName.trim()) {
    return res.status(400).json({ 
      message: 'Brand name is required and must be a valid string', 
      status: "error" 
    });
  }

  try {
    // Generate a unique brand ID
    const brandId = await generateBrandId();

    // Save brand data to the database
    const newBrand = new Brand({
      brandId,  
      brand: brandName.trim(),
    });

    const savedBrand = await newBrand.save();

    res.status(201).json({
      message: 'Brand added successfully',
      brand: savedBrand, 
      status: "success",
    });
  } catch (err) {
    console.error('Error saving brand:', err);
    res.status(500).json({ 
      message: 'Error saving brand data', 
      error: err.message, 
      status: "error" 
    });
  }
});

// ✅ GET all brands data (sorted by created date) (with token verification)
router.get('/view', verifyToken, async (req, res) => {  
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Brands fetched successfully',
      brands,
      status: "success",
    });
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({
      message: 'Error fetching brands data',
      error: err.message,
      status: "error",
    });
  }
});

export default router;
