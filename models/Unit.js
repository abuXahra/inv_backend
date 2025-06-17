const mongoose = require("mongoose");

const UnitSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      require: true,
      unique: true,
    },
    note: {
      type: String,
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

module.exports = mongoose.model("Unit", UnitSchema);
