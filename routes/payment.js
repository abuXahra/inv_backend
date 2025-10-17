const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");
const verifyToken = require("../verifyToken");

router.post("/register", verifyToken, paymentController.registerPayment);
router.get("/", verifyToken, paymentController.getPayments);
router.delete("/bulk-delete", verifyToken, paymentController.bulkDeletePayment);
router.get(
  "/total-payable",
  verifyToken,
  paymentController.getTotalPayableAmount
);
// dynamic routes
router.get("/:paymentId", verifyToken, paymentController.getPayment);
router.put("/:paymentId", verifyToken, paymentController.updatePayment);
router.delete("/:paymentId", verifyToken, paymentController.deletePayment);

module.exports = router;
