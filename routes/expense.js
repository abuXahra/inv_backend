const express = require("express");
const router = express.Router();
const expenseController = require("../controller/expenseController");
const verifyToken = require("../verifyToken");

// create
router.post("/create", verifyToken, expenseController.createExpense);

// fetch all
router.get("/", verifyToken, expenseController.fetchAllExpense);

// bulk delete
router.delete(
  "/bulk-delete",
  verifyToken,
  expenseController.bulkDeleteExpenses
);

router.get(
  "/expense-total",
  verifyToken,
  expenseController.getTotalExpenseAmount
);

// fetch single
router.get("/:expenseId", verifyToken, expenseController.fetchExpense);

// update
router.put("/:expenseId", verifyToken, expenseController.updateExpense);

// delete
router.delete("/:expenseId", verifyToken, expenseController.deleteExpense);

module.exports = router;
