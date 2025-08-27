const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    paymentDate: {
      type: Date,
      required: true,
    },
    paymentFor: {
      type: String, // Example: SA1001 (Sale) or PU1001 (Purchase)
      required: true,
    },
    invoiceNo: {
      type: String, // Will be auto-filled with paymentFor code
      required: true,
    },
    dueBalance: {
      type: Number, // Comes from Sale/Purchase dueBalance
      required: true,
    },
    payableAmount: {
      type: Number, // How much user is paying now
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["Card", "Cash", "Check", "Online", "Bank Transfer", "N/A"],
      required: true,
    },
    note: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
