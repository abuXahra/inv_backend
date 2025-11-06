const mongoose = require("mongoose");

const WastageSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // Return reference code
    wastageDate: { type: Date, required: true },

    // Link to the original purchase (invoice from supplier)
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    reason: { type: String },
    invoiceNo: { type: String },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: { type: String, required: true },
    quantity: { type: Number, required: true },
    tax: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    price: { type: Number, required: true },
    amount: { type: Number, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wastage", WastageSchema);
