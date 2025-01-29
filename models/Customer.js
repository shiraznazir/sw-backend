import mongoose from "mongoose";

// Enum for status
const StatusEnum = {
  Incoming: 0,
  Pending: 1,
  Ongoing: 2,
  Cancel: 3,
  Closed: 4,
};

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
    },
    email: {
      type: String,
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
      default: StatusEnum.Pending,  // Default to Pending
      validate: {
        validator: (value) => Object.values(StatusEnum).includes(value),
        message: `Status must be one of the following: ${Object.keys(StatusEnum).join(', ')}.`,
      },
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
    technicianId: {
      type: String,
      required: false,
    },
    brand: {
      type: String,
      required: false,
    },
    indoor_model_number: {
      type: String,
      required: false,
    },
    outdoor_model_number: {
      type: String,
      required: false,
    },
    indoor_serial_number: {
      type: String,
      required: false,
    },
    outdoor_serial_number: {
      type: String,
      required: false,
    },
    model_number: {
      type: String,
      required: false,
    },
    serial_number: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    collected_amount: {
      type: String,
      required: false,
    },
    sc_type: {
      type: String,
      required: false,
    },
    closing_date:{
      type: Date,
      required: false,
    },
    work: {
      type: String,
      required: false,
    },
    next_date:{
      type: Date,
      required: false,
    }
  },
  { timestamps: true }
);

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default Customer;
