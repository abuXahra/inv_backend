const mongoose = require("mongoose");

const SaleItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    required: true,
  },
  taxAmount: {
    type: Number,
    required: true,
  },
  unitCost: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
});

const SaleSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },

    // customer info
    saleDate: {
      type: Date,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    saleStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    reference: {
      type: String,
    },

    // payment info
    saleAmount: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    dueBalance: {
      type: Number,
      default: function () {
        return this.saleAmount; // initially full amount is due
      },
    },
    note: {
      type: String,
    },
    subTotal: {
      type: Number,
      default: 0,
    },
    otherCharges: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    shipping: {
      type: Number,
      default: 0,
    },

    saleItems: [SaleItemSchema],

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Virtual: isFullyPaid
 * Returns true if the sale is completely paid off
 */
SaleSchema.virtual("isFullyPaid").get(function () {
  return this.dueBalance <= 0 && this.paymentStatus === "paid";
});

// Ensure virtuals are included when converting to JSON
SaleSchema.set("toJSON", { virtuals: true });
SaleSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Sale", SaleSchema);
