const mongoose = require("mongoose");

const PurchaseReturnSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // Return reference code
    returnDate: { type: Date, required: true },

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

    returnAmount: { type: Number, required: true },
    reason: { type: String },

    // Only the returned products go here
    returnItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        title: String,
        quantity: Number,
        unitCost: Number,
        price: Number,
        amount: Number,
      },
    ],

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseReturn", PurchaseReturnSchema);
