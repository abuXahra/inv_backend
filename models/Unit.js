const mongoose = require("mongoose");

const UnitSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    note: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["ON", "OFF"],
      default: "ON",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Unit", UnitSchema);
