const Expense = require("../models/Expense");

// create Expense width expenses Initial
exports.createExpense = async (req, res) => {
  try {
    const data = req.body;
    const prefix = data.prefix;

    // Find the last expense with the same prefix
    const lastExpense = await Expense.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;

    if (lastExpense && lastExpense.code) {
      const match = lastExpense.code.match(/\d+$/); // Extract the numeric part from the code
      if (match) {
        lastSerial = parseInt(match[0], 10);
      }
    }

    // For multiple items
    if (Array.isArray(data.items)) {
      const newExpenses = data.items.map((item, index) => {
        const serial = (lastSerial + index + 1).toString().padStart(4, "0");
        const code = `${prefix}${serial}`;
        return { ...item, code };
      });

      const savedExpenses = await Expense.insertMany(newExpenses);
      return res.status(201).json({
        message: "Expenses added successfully",
        expenses: savedExpenses,
      });
    }

    // For single item
    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;

    const newExpense = new Expense({ ...data, code });
    const savedExpense = await newExpense.save();

    res.status(201).json({
      message: "Expense added successfully",
      expense: savedExpense,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// get all Expenses
exports.fetchAllExpense = async (req, res) => {
  try {
    const expense = await Expense.find({});
    res.status(200).json(expense);
  } catch (error) {
    console.log(error);
  }
};

// get Expense
exports.fetchExpense = async (req, res) => {
  const expenseId = req.params.expenseId;
  try {
    const expense = await Expense.findById(expenseId);
    res.status(200).json(expense);
  } catch (error) {
    console.log(error);
  }
};

// update expense
exports.updateExpense = async (req, res) => {
  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.expenseId,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedExpense);
  } catch (err) {
    res.status(500).json(err);
  }
};

// delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const expenseId = req.params.expenseId;
    const expense = await Expense.findByIdAndDelete(expenseId);
    return res
      .status(200)
      .json({ expense, message: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};

// bulk delete
exports.bulkDeleteExpenses = async (req, res) => {
  try {
    const { ids } = req.body; // Expecting an array of IDs
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No expense IDs provided." });
    }

    // Delete expenses by IDs
    const result = await Expense.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No expenses found to delete." });
    }

    res.status(200).json({
      message: `${result.deletedCount} expenses deleted successfully.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during bulk delete." });
  }
};

// Get Total of All Expense Amounts
exports.getTotalExpenseAmount = async (req, res) => {
  try {
    const result = await Expense.aggregate([
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
        },
      },
    ]);

    const total = result[0]?.totalExpense || 0;

    res.status(200).json({ totalExpenseAmount: total });
  } catch (error) {
    console.error(
      "Error getting total Expense amount:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
