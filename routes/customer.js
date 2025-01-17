import express from 'express';
import Customer from '../models/Enquiry.js';

const router = express.Router();

// ✅ GET customer data
router.get('/', async (req, res) => {
  try {
    const type = "customer";

    // ✅ Await the query result
    const customerData = await Customer.find({ type });

    const customersData = customerData.map((customer) => ({
      callId: customer.callId,
      name: customer.name,
      mobileNumber: customer.mobileNumber,
      email: customer.email,
      pincode: customer.pincode,
      status: customer.status,
    }));
    
    res.status(200).json({
      customers: customersData,
      status: true,
    });
  } catch (err) {
    if (err.code === 'ECONNRESET') {
      console.error('Connection was reset:', err);
      res.status(503).json({ message: 'Service temporarily unavailable. Please try again later.' });
    } else {
      console.error('Error fetching customer data:', err);
      res.status(500).json({ message: 'Error fetching customer data', error: err.message });
    }
  }
});

export default router;
