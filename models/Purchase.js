const mongoose = require("mongoose");

const PurchaseItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
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

const PurchaseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    // supply info
    purchaseDate: {
      type: Date,
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    purchaseStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    reference: {
      type: String,
    },

    // payment info
    purchaseAmount: {
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
        return this.purchaseAmount; // initially full amount is due
      },
    },
    note: {
      type: String,
      required: false,
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
    purchaseItems: [PurchaseItemSchema],
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
PurchaseSchema.virtual("isFullyPaid").get(function () {
  return this.dueBalance <= 0 && this.paymentStatus === "paid";
});

// Ensure virtuals are included when converting to JSON
PurchaseSchema.set("toJSON", { virtuals: true });
PurchaseSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Purchase", PurchaseSchema);
