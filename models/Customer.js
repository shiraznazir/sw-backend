import mongoose from "mongoose";

const StatusEnum = {
  INCOMING: 0,
  PENDING: 1,
  ONGOING: 2,
  CANCELLED: 3,
  CLOSED: 4,
};

const customerSchema = new mongoose.Schema(
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
      match: [/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid email address"],
      lowercase: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      match: [/^[0-9]{6}$/, "Please enter a valid 6-digit pincode"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message must not exceed 1000 characters"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: [500, "Address must not exceed 500 characters"],
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      trim: true,
      enum: { values: ["customer", "other"], message: "Type must be either 'customer' or 'other'" },
    },
    status: {
      type: Number,
      required: [true, "Status is required"],
      default: StatusEnum.INCOMING,
      enum: {
        values: Object.values(StatusEnum),
        message: `Status must be one of: ${Object.keys(StatusEnum).join(", ")}`,
      },
    },
    reason: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Reason must not exceed 500 characters"],
    },
    callId: {
      type: String,
      unique: true, // Unique implies index, no duplicate needed
      required: [true, "Call ID is required"],
      trim: true,
    },
    // ... other fields remain unchanged ...
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes (removed duplicate for callId)
customerSchema.index({ type: 1, createdAt: -1 });
customerSchema.index({ type: 1, status: 1 });

// Pre-save and post-save hooks remain unchanged
customerSchema.pre("save", function (next) {
  if (this.isModified("collected_amount") && this.collected_amount !== undefined) {
    this.collected_amount = Math.round(this.collected_amount * 100) / 100;
  }
  this.updatedAt = new Date();
  next();
});

customerSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("Duplicate callId detected"));
  } else {
    next(error);
  }
});

customerSchema.set("autoIndex", process.env.NODE_ENV !== "production");

const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);

export default Customer;