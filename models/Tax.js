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
      required: true, // ✅ fixed spelling
      validate: {
        validator: Number.isInteger, // ✅ enforce integer
        message: "{VALUE} is not an integer value",
      },
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
