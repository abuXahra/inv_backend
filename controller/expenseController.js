const Expense = require("../models/Expense");
const logActivity = require("../utils/activityLogger");

// create Expense width expenses Initial
// create Expense with expenses Initial
exports.createExpense = async (req, res) => {
  try {
    const data = req.body;
    const prefix = data.prefix;
    const user = req.user; // comes from verifyToken

    // Find the last expense with the same prefix
    const lastExpense = await Expense.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;

    if (lastExpense && lastExpense.code) {
      const match = lastExpense.code.match(/\d+$/);
      if (match) {
        lastSerial = parseInt(match[0], 10);
      }
    }

    /* ============================
       BULK EXPENSE ITEMS (WITH LOGS)
    ============================ */
    if (Array.isArray(data.items)) {
      const newExpenses = data.items.map((item, index) => {
        const serial = (lastSerial + index + 1).toString().padStart(4, "0");
        const code = `${prefix}${serial}`;

        return {
          ...item,
          code,
          createdBy: user._id,
        };
      });

      const savedExpenses = await Expense.insertMany(newExpenses);

      // 🔹 Activity logs ONLY for bulk items
      for (const expense of savedExpenses) {
        await logActivity({
          user,
          action: "ADD",
          module: "Expense",
          documentId: expense._id,
          description: `"${expense.expenseFor}" added to expense`,
          newData: {
            title: expense.expenseFor,
            code: expense.code,
            status: expense.status || "",
          },
        });
      }

      return res.status(201).json({
        message: "Expenses added successfully",
        expenses: savedExpenses,
      });
    }

    /* ============================
       SINGLE EXPENSE ITEM (NO LOG)
    ============================ */
    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;

    const newExpense = new Expense({
      ...data,
      code,
      createdBy: user._id,
    });

    const savedExpense = await newExpense.save();

    return res.status(201).json({
      message: "Expense added successfully",
      expense: savedExpense,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.createExpense1 = async (req, res) => {
  try {
    const data = req.body;
    const prefix = data.prefix;
    const user = req.user; // comes from verifyToken

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

    // Activity log
    await logActivity({
      user,
      action: "ADD",
      module: "Expense",
      documentId: savedExpense._id,
      description: `"${savedExpense.expenseFor}" added to expense `,
      newData: {
        title: savedExpense.expenseFor,
        code: savedExpense.code,
        status: "",
      },
    });

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
    const user = req.user; // comes from verifyToken

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.expenseId,
      { $set: req.body },
      { new: true },
    );

    // Activity log
    await logActivity({
      user,
      action: "UPDATE",
      module: "Expense",
      documentId: updatedExpense._id,
      description: `Updated "${updatedExpense.expenseFor}" expense`,
      newData: {
        title: updatedExpense.expenseFor,
        code: updatedExpense.code,
        status: "",
      },
    });

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
    const user = req.user; // comes from verifyToken

    // Activity log
    await logActivity({
      user,
      action: "DELETE",
      module: "Expense",
      documentId: updatedExpense._id,
      description: `Deleted expense for "${updatedExpense.expenseFor}"`,
      newData: {
        title: updatedExpense.expenseFor,
        code: updatedExpense.code,
        status: "",
      },
    });

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
    const user = req.user; // comes from verifyToken

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No expense IDs provided." });
    }

    // 1️⃣ Fetch expense before deletion (for logging)
    const expenses = await Expense.find({ _id: { $in: ids } });

    if (expenses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No expenses found.",
      });
    }

    // Delete expenses by IDs
    const result = await Expense.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No expenses found to delete." });
    }

    // 3️⃣ Log activity per expense
    await Promise.all(
      expenses.map((expense) =>
        logActivity({
          user,
          action: "DELETE",
          module: "Expense",
          documentId: expense._id,
          description: `Deleted expense for "${expense.expenseFor}"`,
          oldData: {
            title: expense.expenseFor,
            code: expense.code,
            status: "",
          },
        }),
      ),
    );

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
      error.stack,
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
