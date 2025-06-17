const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      unique: true,
    },
    unit: String,
    sku: String,
    quantityAlert: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },

    imgUrl: String,

    // purchase info
    price: {
      type: String,
      required: true,
    },

    tax: {
      type: String,
    },

    purchasePrice: {
      type: String,
      required: true,
    },

    // sale info
    taxType: {
      type: String,
    },

    profitMargin: {
      type: String,
    },

    sellingPrice: {
      type: String,
      required: true,
    },

    sellingPrice: {
      type: String,
      required: true,
    },

    OpenStock: {
      type: String,
      require: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
