const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    expenseDate: {
      type: Date,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    expenseFor: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", ExpenseSchema);
