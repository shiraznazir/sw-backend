import mongoose from 'mongoose';

const technicianSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address'],
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'],
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  id_proof: {
    type: String,
    required: [true, 'ID name is required'],
    trim: true,
  },
  // Storing image names or paths, rather than actual image data (Buffer)
  // front_image_name: {
  //   type: String,
  //   required: [true, 'Front image is required'],
  // },
  // back_image_name: {
  //   type: String,
  //   required: [true, 'Back image is required'],
  // },
  // Optional: Store images as binary data (Buffer) if you want to keep them in the DB
  // front_image: Buffer, 
  // back_image: Buffer,
  area: {
    type: String,
    required: [true, 'Area is required'],
    trim: true,
  },
  technicianId: {
    type: String,
    required: [true, 'Technician ID is required'],
    unique: true,
  }
}, { timestamps: true });

const Technician = mongoose.models.Technician || mongoose.model('Technician', technicianSchema);

export default Technician;