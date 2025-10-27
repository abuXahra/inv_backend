const express = require("express");
const router = express.Router();
const expenseController = require("../controller/expenseController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

// create
router.post(
  "/create",
  verifyToken,
  checkPermission("Expense", "canAdd"),
  expenseController.createExpense
);

// fetch all
router.get("/", verifyToken, expenseController.fetchAllExpense);

// bulk delete
router.delete(
  "/bulk-delete",
  verifyToken,
  checkPermission("Expense", "canDelete"),
  expenseController.bulkDeleteExpenses
);

router.get(
  "/expense-total",
  // verifyToken,
  expenseController.getTotalExpenseAmount
);

// fetch single
router.get(
  "/:expenseId",
  verifyToken,
  checkPermission("Expense", "canView"),
  expenseController.fetchExpense
);

// update
router.put(
  "/:expenseId",
  verifyToken,
  checkPermission("Expense", "canEdit"),
  expenseController.updateExpense
);

// delete
router.delete(
  "/:expenseId",
  verifyToken,
  checkPermission("Expense", "canDelete"),
  expenseController.deleteExpense
);

module.exports = router;
