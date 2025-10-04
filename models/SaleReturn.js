// const mongoose = require("mongoose");

// const ReturnItemSchema = new mongoose.Schema({
//   productId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Product",
//     required: true,
//   },
//   quantity: { type: Number, required: true },
//   amount: { type: Number, required: true },
// });

// const SalesReturnSchema = new mongoose.Schema(
//   {
//     code: { type: String, required: true, unique: true },
//     returnDate: { type: Date, required: true },
//     sale: { type: mongoose.Schema.Types.ObjectId, ref: "Sale", required: true },
//     customer: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//       required: true,
//     },
//     returnAmount: { type: Number, required: true },
//     reason: { type: String },
//     paymentType: { type: String, required: true },
//     paymentStatus: {
//       type: String,
//       enum: ["unpaid", "partial", "paid"],
//       default: "unpaid",
//     },
//     amountPaid: { type: Number, default: 0 },
//     dueBalance: { type: Number, default: 0 },
//     subTotal: { type: Number, default: 0 },
//     otherCharges: { type: Number, default: 0 },
//     discount: { type: Number, default: 0 },
//     discountValue: { type: Number, default: 0 },
//     shipping: { type: Number, default: 0 },
//     returnItems: [ReturnItemSchema],
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// // ✅ Pre-save hook to calculate total return amount and due balance
// SalesReturnSchema.pre("save", function (next) {
//   if (
//     this.isModified("returnItems") ||
//     this.isModified("otherCharges") ||
//     this.isModified("discountValue") ||
//     this.isModified("shipping") ||
//     this.isModified("amountPaid")
//   ) {
//     const totalAmount = this.returnItems.reduce(
//       (sum, item) => sum + item.amount,
//       0
//     );
//     this.subTotal = totalAmount;
//     this.returnAmount =
//       this.subTotal + this.otherCharges - this.discountValue + this.shipping;
//     this.dueBalance = this.returnAmount - this.amountPaid;

//     if (this.amountPaid >= this.returnAmount) {
//       this.paymentStatus = "paid";
//     } else if (this.amountPaid > 0) {
//       this.paymentStatus = "partial";
//     } else {
//       this.paymentStatus = "unpaid";
//     }
//   }
//   next();
// });

// module.exports = mongoose.model("SalesReturn", SalesReturnSchema);

const mongoose = require("mongoose");

const ReturnItemSchema = new mongoose.Schema({
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
  amount: { type: Number, required: true }, // quantity * price
});

const SalesReturnSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    returnDate: { type: Date, required: true },

    sale: { type: mongoose.Schema.Types.ObjectId, ref: "Sale", required: true },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    returnAmount: { type: Number, required: true },

    reason: { type: String },
    invoiceNo: { type: String },
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
        return this.returnAmount; // initially full amount is due
      },
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

    returnItems: [ReturnItemSchema],

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalesReturn", SalesReturnSchema);
