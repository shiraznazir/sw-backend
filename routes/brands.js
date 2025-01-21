import express from 'express';
import Brand from '../models/Brand';
import { nanoid } from 'nanoid';  
import verifyToken from './middleware/verifyToken'; 

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

// Create a new brand (with token verification)
router.post('/', verifyToken, async (req, res) => { 
  const { brand } = req.body;

  // Validation
  if (!brand) {
    return res.status(400).json({ message: 'Brand name is compulsory' });
  }

  try {
    // Generate a unique brand ID
    const brandId = await generateBrandId();

    // Save brand data to the database
    const newBrand = new Brand({
      brandId: brandId,  // Attach the unique brand ID
      brand,
    });

    const savedBrand = await newBrand.save();

    res.status(201).json({
      message: 'Brand added successfully',
      brand: savedBrand, 
      status: true,
    });
  } catch (err) {
    console.error('Error saving brand:', err);
    res.status(500).json({ message: 'Error saving brand data', error: err.message });
  }
});

// ✅ GET all brands data (sorted by created date) (with token verification)
router.get('/', verifyToken, async (req, res) => {  
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });

    res.status(200).json({
      brands: brands,
      status: true,
    });
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({
      message: 'Error fetching brands data',
      error: err.message,
      status: false,
    });
  }
});

export default router;
