const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");

router.post("/register", paymentController.registerPayment);
router.get("/", paymentController.getPayments);
router.delete("/bulk-delete", paymentController.bulkDeletePayment);
router.get("/:paymentId", paymentController.getPayment);
// router.put("/:paymentId", paymentController.updatePayment);
router.delete("/:paymentId", paymentController.deletePayment);

module.exports = router;
