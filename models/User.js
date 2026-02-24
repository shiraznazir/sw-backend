import mongoose from "mongoose";
import crypto from "crypto";

// Define the User Schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [50, "Username must not exceed 50 characters"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      match: [/^[0-9]{10}$/, "Mobile number must be a valid 10-digit number"],
      unique: true, // Unique implies index, no need for explicit index
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Unique implies index, no need for explicit index
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      maxlength: [128, "Password must not exceed 128 characters"],
      select: false, // Exclude from queries by default
    },
    userId: {
      type: String,
      unique: true, // Unique implies index, no need for explicit index
      uppercase: true,
      required: [true, "User ID is required"],
      trim: true,
      default: function () {
        const timestamp = Date.now().toString(36);
        const randomStr = crypto.randomBytes(3).toString("hex").toUpperCase();
        return `USER-${timestamp}-${randomStr}`;
      },
      match: [/^USER-[A-Z0-9]{5,}$/, "User ID must follow the format USER-XXXXX"],
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true },
  }
);

// Additional index for sorting (non-unique)
userSchema.index({ createdAt: -1 }); // Only keep this as it’s not covered by unique fields

// Enable virtuals in JSON output
userSchema.set("toJSON", { virtuals: true });

// Pre-save hook to update timestamp
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Handle duplicate key errors
userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    next(new Error(`Duplicate ${field} detected: ${error.keyValue[field]}`));
    if (error.keyValue) {
      const field = Object.keys(error.keyValue)[0];
      next(new Error(`Duplicate ${field} detected: ${error.keyValue[field]}`));
    } else {
      next(new Error("Duplicate key error detected"));
    }
  } else {
    next(error);
  }
});

// Virtual for readable timestamps (optional)
userSchema.virtual("createdAtFormatted").get(function () {
  return this.createdAt.toISOString();
});
userSchema.virtual("updatedAtFormatted").get(function () {
  return this.updatedAt.toISOString();
});

// Optimize queries
userSchema.set("autoIndex", process.env.NODE_ENV !== "production"); // Disable in production if indexes are pre-created

// Add validation robustness
userSchema.pre("validate", function (next) {
  if (this.isModified("email") && this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.isModified("username") && this.username) {
    this.username = this.username.trim();
  }
  if (this.isModified("mobile") && this.mobile) {
    this.mobile = this.mobile.trim();
  }
  next();
});

// Method to update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save();
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;