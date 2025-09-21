const mongoose = require("mongoose");

const PrefixSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  product: {
    type: String,
    required: true,
  },
  supply: {
    type: String,
    required: true,
  },
  purchase: {
    type: String,
    required: true,
  },
  customer: {
    type: String,
    required: true,
  },
  sale: {
    type: String,
    required: true,
  },
  expense: {
    type: String,
    required: true,
  },
  saleReturn: {
    type: String,
    required: true,
  },
  purchaseReturn: {
    type: String,
    required: true,
  },
});

const CompanySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      unique: true,
    },
    tagLine: String,
    businessType: {
      type: String,
      required: true,
    },
    ownersName: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    phoneNumber: String,
    faxNumber: String,
    taxNumber: String,
    companyEmail: String,
    currencyCode: {
      type: String,
      required: true,
    },
    currencySymbol: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    companyLogo: String,
    prefixes: [PrefixSchema],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", CompanySchema);
