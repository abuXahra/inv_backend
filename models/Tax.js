const mongoose = require("mongoose");

const TaxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      unique: true,
    },
    taxPercentage: {
      type: Number,
      require: true,
    },
    status: {
      type: String,
      require: true,
      enum: ["ON", "OFF"],
      default: "ON",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tax", TaxSchema);
