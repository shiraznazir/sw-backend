import express from 'express';
import Customer from '../models/Customer.js';
import { nanoid } from 'nanoid';
import verifyToken from '../middleware/verifyToken.js'; 

const router = express.Router();

async function generateUniqueCallId() {
  let callId;
  let isUnique = false;

  while (!isUnique) {
    callId = `CALL-${nanoid(8).toUpperCase()}`;
    const existingCustomer = await Customer.findOne({ callId });
    if (!existingCustomer) {
      isUnique = true;
    }
  }
  return callId;
}

// Create a new customer
router.post('/create', async (req, res) => {
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

// ✅ GET all customer data (sorted by created date)
router.get('/', verifyToken, async (req, res) => {
  try {
    const customers = await Customer.find({ type: 'customer' }).sort({ createdAt: -1 });

    const customersData = customers.map((customer) => ({
      callId: customer.callId,
      name: customer.name,
      mobileNumber: customer.mobileNumber,
      email: customer.email,
      pincode: customer.pincode,
      status: customer.status,
      createdAt: customer.createdAt,
    }));

    res.status(200).json({
      customers: customersData,
      status: true,
    });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({
      message: 'Error fetching customer data',
      error: err.message,
      status: false,
    });
  }
});

// ✅ GET customer data by callId
router.get('/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const customer = await Customer.findOne({ type: 'customer', callId });

    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found',
        status: false,
      });
    }

    res.status(200).json({
      customer,
      status: true,
    });
  } catch (err) {
    console.error(`Error fetching customer with callId ${req.params.callId}:`, err);
    res.status(500).json({
      message: 'Error fetching customer data',
      error: err.message,
      status: false,
    });
  }
});

// ✅ UPDATE customer data by callId
router.put('/update/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const updates = req.body;

    const updatedCustomer = await Customer.findOneAndUpdate(
      { type: 'customer', callId },
      { $set: updates },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        message: 'Customer not found',
        status: false,
      });
    }

    res.status(200).json({
      message: 'Customer updated successfully',
      customer: updatedCustomer,
      status: true,
    });
  } catch (err) {
    console.error(`Error updating customer with callId ${req.params.callId}:`, err);
    res.status(500).json({
      message: 'Error updating customer data',
      error: err.message,
      status: false,
    });
  }
});

// ✅ UPDATE customer status by callId
router.post('/update/status/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Status is required',
        status: false,
      });
    }

    const updatedCustomer = await Customer.findOneAndUpdate(
      { type: 'customer', callId },
      { $set: { status } },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        message: 'Customer not found',
        status: false,
      });
    }

    res.status(200).json({
      message: 'Customer status updated successfully',
      customer: updatedCustomer,
      status: true,
    });
  } catch (err) {
    console.error(`Error updating status for callId ${req.params.callId}:`, err);
    res.status(500).json({
      message: 'Error updating customer status',
      error: err.message,
      status: false,
    });
  }
});

// ✅ CANCEL Call by callId
router.post('/update/cancel/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, reason } = req.body;

    if (!status || !reason) {
      return res.status(400).json({
        message: 'Status and reason are required',
        status: false,
      });
    }

    const updatedCustomer = await Customer.findOneAndUpdate(
      { type: 'customer', callId },
      { $set: { status, reason } },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        message: 'Customer not found',
        status: false,
      });
    }

    res.status(200).json({
      message: 'Call cancelled successfully',
      customer: updatedCustomer,
      status: true,
    });
  } catch (err) {
    console.error(`Error cancelling call for callId ${req.params.callId}:`, err);
    res.status(500).json({
      message: 'Error cancelling the call',
      error: err.message,
      status: false,
    });
  }
});

export default router;
