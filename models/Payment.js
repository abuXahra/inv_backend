const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    paymentDate: {
      type: Date,
      required: true,
    },
    paymentFor: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
    },
    dueAmount: {
      type: String,
      required: true,
    },
    paymentType: {
      type: String,
      required: true,
    },
    payableAmount: {
      type: Number,
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
