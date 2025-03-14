import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
      minlength: [2, "Brand name must be at least 2 characters"],
      maxlength: [100, "Brand name must not exceed 100 characters"],
      unique: true, // Unique implies index, no need for explicit index
    },
    brandId: {
      type: String,
      unique: true, // Unique implies index, no need for explicit index
      required: [true, "Brand ID is required"],
      trim: true,
      match: [/^BRAND-[A-Z0-9]{8,}$/, "Brand ID must follow the format BRAND-XXXXXXXX"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true },
  }
);

// Only keep non-unique index for sorting
brandSchema.index({ createdAt: -1 });

// Enable virtuals in JSON output
brandSchema.set("toJSON", { virtuals: true });

// Pre-save hook to update timestamp
brandSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Handle duplicate key errors
brandSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    next(new Error(`Duplicate ${field} detected: ${error.keyValue[field]}`));
  } else {
    next(error);
  }
});

// Optimize queries
brandSchema.set("autoIndex", process.env.NODE_ENV !== "production"); // Disable in production if indexes are pre-created

// Add validation robustness
brandSchema.pre("validate", function (next) {
  if (this.isModified("brand") && this.brand) {
    this.brand = this.brand.trim();
  }
  next();
});

// Virtual for readable timestamps (optional)
brandSchema.virtual("createdAtFormatted").get(function () {
  return this.createdAt.toISOString();
});
brandSchema.virtual("updatedAtFormatted").get(function () {
  return this.updatedAt.toISOString();
});

const Brand = mongoose.models.Brand || mongoose.model("Brand", brandSchema);

export default Brand;