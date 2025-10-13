const express = require("express");
const router = express.Router();
const expenseController = require("../controller/expenseController");

// create
router.post("/create", expenseController.createExpense);

// fetch all
router.get("/", expenseController.fetchAllExpense);

// bulk delete
router.delete("/bulk-delete", expenseController.bulkDeleteExpenses);

router.get("/expense-total", expenseController.getTotalExpenseAmount);

// fetch single
router.get("/:expenseId", expenseController.fetchExpense);

// update
router.put("/:expenseId", expenseController.updateExpense);

// delete
router.delete("/:expenseId", expenseController.deleteExpense);

module.exports = router;
