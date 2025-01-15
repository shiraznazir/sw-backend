import mongoose from "mongoose";

// Customer Schema
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  pincode: { type: String, required: true },
  message: { type: String, required: true },
  address: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: Number, required: true, default: 0 },
  callId: {
    type: String,
    unique: true,
    required: true,
  }
}, { timestamps: true }); // Adds createdAt and updatedAt fields

// Export the Customer model

const Customer = mongoose.model('Customer', customerSchema);

export default Customer; 