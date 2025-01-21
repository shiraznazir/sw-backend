import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      match: [
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please enter a valid email address.',
      ],
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required.'],
      match: [
        /^[0-9]{10}$/,
        'Please enter a valid 10-digit mobile number.',
      ],
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required.'],
      match: [
        /^[0-9]{6}$/,
        'Please enter a valid 6-digit pincode.',
      ],
    },
    message: {
      type: String,
      required: [true, 'Message is required.'],
    },
    address: {
      type: String,
      required: [true, 'Address is required.'],
    },
    type: {
      type: String,
      required: [true, 'Type is required.'],
    },
    status: {
      type: Number,
      required: [true, 'Status is required.'],
      default: 0, 
    },
    reason: {
      type: String,
      default: '',
    },
    callId: {
      type: String,
      unique: [true, 'Call ID must be unique.'],
      required: [true, 'Call ID is required.'],
    },
  },
  { timestamps: true } 
);


const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default Customer;
