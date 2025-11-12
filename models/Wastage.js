const mongoose = require("mongoose");

const WastageSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    wastageDate: { type: Date, required: true },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    invoiceNo: { type: String },
    reason: { type: String },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: { type: String },
    quantity: { type: Number, required: true },
    price: { type: Number },
    tax: { type: Number },
    taxAmount: { type: Number },
    unitCost: { type: Number },
    amount: { type: Number },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wastage", WastageSchema);
