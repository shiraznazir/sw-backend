import mongoose from "mongoose";

const StatusEnum = {
  INCOMING: 0,
  PENDING: 1,
  ONGOING: 2,
  CANCELLED: 3,
  CLOSED: 4,
};

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must not exceed 100 characters"],
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      trim: true,
      enum: { values: ["customer", "other", "hero"], message: "Type must be either 'customer', 'other', or 'hero'" },
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
    callId: {
      type: String,
      unique: true, // Unique implies index, no duplicate needed
      required: [true, "Call ID is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes (removed duplicate for callId)
leadSchema.index({ type: 1, createdAt: -1 });
leadSchema.index({ type: 1, status: 1 });

// The pre-save hook was removed as it was redundant (timestamps: true handles updatedAt) or irrelevant (collected_amount).
leadSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("Duplicate callId detected"));
  } else {
    next(error);
  }
});

leadSchema.set("autoIndex", process.env.NODE_ENV !== "production");

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);

export default Lead;