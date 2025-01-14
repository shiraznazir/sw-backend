const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const Customer = require('../models/Enquiry');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to generate a unique call ID
async function generateUniqueCallId() {
  let isUnique = false;
  let callId;

  while (!isUnique) {
    // Generate a random 32-character hexadecimal string
    callId = crypto.randomBytes(16).toString('hex');

    // Check if callId already exists in the database
    const existingCustomer = await Customer.findOne({ callId });
    if (!existingCustomer) {
      isUnique = true;
    }
  }

  return callId;
}

// Create a new customer
router.post('/', upload.none(), async (req, res) => {
  const { name, email, mobileNumber, pincode, message, address, type } = req.body;

  // Validation
  if (!name || !email || !mobileNumber || !pincode || !message || !address || !type) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Generate a unique call ID
    const callId = await generateUniqueCallId();

    // Save customer data to the database
    const newCustomer = new Customer({
      callId,  // Attach the unique call ID
      name,
      email,
      mobileNumber,
      pincode,
      message,
      address,
      type,
      status: 0,
    });

    const savedCustomer = await newCustomer.save();

    res.status(201).json({
      message: 'Customer added successfully',
      customer: savedCustomer,
      status: true,
    });
  } catch (err) {
    console.error('Error saving customer:', err);
    res.status(500).json({ message: 'Error saving customer data', error: err.message });
  }
});

module.exports = router;
