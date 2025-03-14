import mongoose from "mongoose";

const technicianSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must not exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid email address"],
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: [500, "Address must not exceed 500 characters"],
    },
    id_proof: {
      type: String,
      required: [true, "ID proof name is required"],
      trim: true,
      enum: { values: ["Aadhar", "PAN", "Driving License", "Passport"], message: "ID proof must be one of: Aadhar, PAN, Driving License, Passport" },
    },
    front_image: {
      type: String,
      required: [true, "Front image path is required"],
      trim: true,
      maxlength: [255, "Front image path must not exceed 255 characters"],
    },
    back_image: {
      type: String,
      required: [true, "Back image path is required"],
      trim: true,
      maxlength: [255, "Back image path must not exceed 255 characters"],
    },
    area: {
      type: String,
      required: [true, "Area is required"],
      trim: true,
      maxlength: [100, "Area must not exceed 100 characters"],
    },
    technicianId: {
      type: String,
      unique: true, // Unique implies index, no duplicate needed
      required: [true, "Technician ID is required"],
      trim: true,
      match: [/^TECH-[A-Z0-9]{8,}$/, "Technician ID must follow the format TECH-XXXXXXXX"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index (removed duplicate for technicianId)
technicianSchema.index({ createdAt: -1 });

technicianSchema.set("toJSON", { virtuals: true });

technicianSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

technicianSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    next(new Error(`Duplicate ${field} detected: ${error.keyValue[field]}`));
  } else {
    next(error);
  }
});

technicianSchema.set("autoIndex", process.env.NODE_ENV !== "production");

const Technician = mongoose.models.Technician || mongoose.model("Technician", technicianSchema);

export default Technician;