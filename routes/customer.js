import express from 'express';
import multer from 'multer'; 
import Customer from '../models/Customer.js';
import { nanoid } from 'nanoid';
import verifyToken from '../middleware/verifyToken.js';
import sendWhatsAppMessage from "../utils/sendWhatsapp.js"

const router = express.Router();

// Configure multer for handling multipart form data
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Function to generate unique call ID
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

// ✅ Create a new customer
router.post('/create', upload.none(), async (req, res) => {
  const { name, email, mobileNumber, pincode, message, address, type } = req.body;

  // Validation
  if (!name || !email || !mobileNumber || !pincode || !message || !address || !type) {
    return res.status(400).json({ message: 'All fields are required', status: "error" });
  }

  try {
    // Generate a unique call ID
    const callId = await generateUniqueCallId();

    // Save customer data to the database
    const newCustomer = new Customer({
      callId,
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
  
    const welcomeMessage = "Welcome to Service Walah";
    await sendWhatsAppMessage({ mobileNo: mobileNumber, message: welcomeMessage });

    res.status(201).json({
      message: 'Customer added successfully',
      customer: savedCustomer,
      status: "success",
    });
  } catch (err) {
    console.error('Error saving customer:', err);
    res.status(500).json({ message: 'Error saving customer data', error: err.message, status: "error" });
  }
});

// ✅ GET all customer data (sorted by creation date)
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
      next_date: customer.next_date,
      createdAt: customer.createdAt,
    }));

    res.status(200).json({ customers: customersData, status: "success" });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching customer data', error: err.message, status: "error" });
  }
});

// ✅ GET customer data by callId
router.get('/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const customer = await Customer.findOne({ type: 'customer', callId });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found', status: "error" });
    }

    res.status(200).json({ customer, status: "success" });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching customer data', error: err.message, status: "error" });
  }
});

// ✅ UPDATE customer data by callId
router.post('/update/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const updates = req.body;

    // Ensure that updates are provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No update data provided', status: false });
    }

    const updatedCustomer = await Customer.findOneAndUpdate(
      { type: 'customer', callId },
      { $set: updates },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found', status: "error" });
    }

    res.status(200).json({ message: 'Customer updated successfully', customer: updatedCustomer, status: "success" });
  } catch (err) {
    console.error(`Error updating customer`, err);
    res.status(500).json({ message: 'Error updating customer data', error: err.message, status: "error" });
  }
});

// ✅ Transfer call by callId
router.post('/update/transfer/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const { brand, technicianId, work } = req.body;

    // Check if brand, technicianId, or work is missing
    if (!technicianId || !work || !brand) {
      return res.status(400).json({ message: 'Technician ID, work, and brand are required', status: "error" });
    }

    const updatedCustomer = await Customer.findOneAndUpdate(
      { type: 'customer', callId },
      { $set: { status: 1, technicianId, work, brand } },
      { new: true, runValidators: true }
    );
    
    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found', status: "error" });
    }

    res.status(200).json({ message: 'Customer status updated successfully', customer: updatedCustomer, status: "success" });
  } catch (err) {
    console.error(`Error updating status for callId ${callId}:`, err);
    res.status(500).json({ message: 'Error updating customer status', error: err.message, status: false });
  }
});


// ✅ UPDATE customer to pending calls status by callId
router.post('/update/pending-calls/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const { next_date } = req.body;

    // Validate request parameters
    if (!callId) {
      return res.status(400).json({ message: 'Call ID is required', status: 'error' });
    }

    if (!next_date) {
      return res.status(400).json({ message: 'Next appointment date is required', status: 'error' });
    }

    // Validate if the provided date is in the future
    const parsedDate = new Date(next_date);
    if (isNaN(parsedDate.getTime()) || parsedDate < new Date()) {
      return res.status(400).json({ message: 'Invalid or past date provided', status: 'error' });
    }

    const updatedCustomer = await Customer.findOneAndUpdate(
      { type: 'customer', callId },
      { $set: { status: 2, next_date: parsedDate } },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found', status: 'error' });
    }

    res.status(200).json({
      message: 'Customer status updated successfully',
      customer: updatedCustomer,
      status: 'success'
    });

  } catch (err) {
    console.error(`Error updating status for callId ${req.params.callId}:`, err);

    // Provide a meaningful error response
    res.status(500).json({
      message: 'Internal server error, please try again later',
      status: 'error'
    });
  }
});




// ✅ CANCEL Call by callId
router.post('/update/cancel/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, reason } = req.body;

    if (!status || !reason) {
      return res.status(400).json({ message: 'Status and reason are required', status: false });
    }

    const updatedCustomer = await Customer.findOneAndUpdate(
      { type: 'customer', callId },
      { $set: { status, reason } },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found', status: false });
    }

    res.status(200).json({ message: 'Call cancelled successfully', customer: updatedCustomer, status: true });
  } catch (err) {
    console.error(`Error cancelling call for callId ${callId}:`, err);
    res.status(500).json({ message: 'Error cancelling the call', error: err.message, status: false });
  }
});

// ✅ CLOSE Call (Split)
router.post('/update/close-call/split/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const { 
      indoor_model_number, 
      outdoor_model_number, 
      indoor_serial_number, 
      outdoor_serial_number, 
      description, 
      collected_amount, 
    } = req.body;  

    // Check if none of the fields are provided
    if (
      !indoor_model_number &&  
      !outdoor_model_number && 
      !indoor_serial_number &&
      !outdoor_serial_number && 
      !description && 
      !collected_amount
    ) {
      return res.status(400).json({ message: 'All fields must be provided', status: "error" });
    }
    const today = new Date();
    // Find the customer by callId and update with the provided fields
    const updatedCustomer = await Customer.findOneAndUpdate(
      { type: 'customer', callId },
      { 
        $set: { 
          indoor_model_number,
          outdoor_model_number,
          indoor_serial_number,
          outdoor_serial_number,
          description,
          collected_amount,
          ac_type: "split",
          closing_date: today
        } 
      },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found', status: "error" });
    }

    res.status(200).json({ message: 'Call closed successfully', customer: updatedCustomer, status: "success" });
  } catch (err) {
    console.error(`Error closing call for callId ${callId}:`, err);
    res.status(500).json({ message: 'Error closing the call', error: err.message, status: "error" });
  }
});

// ✅ CLOSE CALL (WINDOW)
router.post('/update/close-call/window/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const { 
      model_number, 
      serial_number, 
      description, 
      collected_amount, 
    } = req.body;  

    // Ensure all necessary fields are provided
    if (
      !model_number ||  
      !serial_number ||
      !description ||
      !collected_amount
    ) {
      return res.status(400).json({ message: 'All fields (model_number, serial_number, description, collected_amount) must be provided', status: "error" });
    }

    const today = new Date();

    // Find the customer by callId and update with the provided fields
    const updatedCustomer = await Customer.findOneAndUpdate(
      { type: 'customer', callId },
      { 
        $set: { 
          model_number,
          serial_number,
          description,
          collected_amount,
          ac_type: "window",
          closing_date: today
        } 
      },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found', status: "error" });
    }

    res.status(200).json({ message: 'Call closed successfully', customer: updatedCustomer, status: "success" });
  } catch (err) {
    console.error(`Error closing call for callId ${callId}:`, err);
    res.status(500).json({ message: 'Error closing the call', error: err.message, status: "error" });
  }
});


export default router;
