import mongoose from "mongoose";

// Brand Schema
const brandSchema = new mongoose.Schema({
  brand: { 
    type: String, 
    required: [true, 'Name is required.'] 
  },
  brandId: {
    type: String,
    unique: [true, 'Brand ID must be unique.'],
    required: [true, 'Brand ID is required.']
  }
}, { timestamps: true }); 

// Export the Brand model
const Brand = mongoose.models.Brand || mongoose.model('Brand', brandSchema);

export default Brand;
