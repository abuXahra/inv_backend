const mongoose = require("mongoose");
const sendEmail = require("../utils/sendMail");
const Company = require("../models/Company");

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
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
    required: false,
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
  wasteQuantity: { type: Number, default: 0 }, // New non-virtual field

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

// ===============================
// 📌 STOCK ALERT: AFTER SAVE
// ===============================
// ProductSchema.post("save", async function (doc) {
//   try {
//     // find company based on the user who created product
//     const company = await Company.findOne({ userId: doc.userId });

//     // receiver = company email OR fallback
//     const adminEmail = company?.companyEmail || process.env.EMAIL_USER;

//     // check stock condition
//     if (doc.stockQuantity <= doc.quantityAlert) {
//       await sendEmail(
//         adminEmail,
//         "⚠️ STOCK ALERT NOTIFICATION",
//         `Product: ${doc.title}
//         Image: ${doc.imgUrl}
//         Stock Quantity: ${doc.stockQuantity}
//         Alert Level: ${doc.quantityAlert}
//         Please restock soon!`
//       );
//     }
//   } catch (err) {
//     console.log("Stock alert error:", err);
//   }
// });

// ProductSchema.post("findOneAndUpdate", async function (result) {
//   if (!result) return;

//   try {
//     const company = await Company.findOne({ userId: result.userId });
//     const adminEmail = company?.companyEmail || process.env.EMAIL_USER;

//     if (result.stockQuantity <= result.quantityAlert) {
//       await sendEmail(
//         adminEmail,
//         "⚠️ STOCK ALERT NOTIFICATION",
//         `Product: ${result.title}
//         Stock Quantity: ${result.stockQuantity}
//         Alert Level: ${result.quantityAlert}
//          Image: ${result.imgUrl}
//         Please restock soon!`
//       );
//     }
//   } catch (err) {
//     console.log("Stock alert error:", err);
//   }
// });

module.exports = mongoose.model("Product", ProductSchema);
