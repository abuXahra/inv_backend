// const mongoose = require("mongoose");

// const ProductSchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true },
//     category: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       required: true,
//     },
//     code: { type: String, unique: true },
//     unit: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Unit",
//       required: true,
//     },
//     sku: { type: String },
//     quantityAlert: { type: Number, required: true },
//     description: { type: String, required: true },
//     imgUrl: { type: String },

//     price: { type: Number, required: true },
//     tax: { type: Number, required: true },
//     taxAmount: { type: Number, required: true },
//     unitCost: { type: Number, required: true },
//     purchasePrice: { type: Number, required: true },
//     taxType: {
//       type: String,
//       enum: ["Inclusive", "Non Inclusive"],
//       required: true,
//     },
//     profitMargin: { type: Number },
//     salePrice: { type: Number, required: true },

//     purchaseQuantity: { type: Number, default: 0 },
//     saleQuantity: { type: Number, default: 0 },
//     saleReturnQuantity: { type: Number, default: 0 },
//     stockQuantity: { type: Number, default: 0 }, // New non-virtual field

//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     status: { type: String, enum: ["ON", "OFF"], default: "ON" },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("Product", ProductSchema);

const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  code: {
    type: String,
    unique: true,
  },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unit",
    required: true,
  },
  sku: {
    type: String,
  },
  quantityAlert: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imgUrl: {
    type: String,
  },

  // Purchase Info
  price: {
    type: Number,
    required: true,
  },

  tax: {
    type: Number, // percentage, e.g., 5, 7, etc.
    required: true,
  },

  taxAmount: {
    type: Number, // percentage, e.g., 5, 7, etc.
    required: true,
  },

  unitCost: {
    type: Number, // percentage, e.g., 5, 7, etc.
    required: true,
  },

  purchasePrice: {
    type: Number,
    required: true,
  },

  // Sale Info
  taxType: {
    type: String, // e.g., Inclusive or Non Inclusive
    enum: ["Inclusive", "Non Inclusive"],
    required: true,
  },
  profitMargin: {
    type: Number,
  },
  salePrice: {
    type: Number,
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
  },

  purchaseQuantity: {
    type: Number,
    default: 0, // ✅ ensures it starts at 0
  },

  saleQuantity: {
    type: Number,
    default: 0, // ✅ ensures it starts at 0
  },
  saleReturnQuantity: { type: Number, default: 0 },
  purchaseReturnQuantity: { type: Number, default: 0 },
  stockQuantity: { type: Number, default: 0 }, // New non-virtual field
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["ON", "OFF"],
    default: "ON",
  },
});

module.exports = mongoose.model("Product", ProductSchema);
