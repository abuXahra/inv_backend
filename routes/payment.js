const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

router.post(
  "/register",
  verifyToken,
  checkPermission("Payment", "canAdd"),
  paymentController.registerPayment
);
router.get("/", verifyToken, paymentController.getPayments);

router.delete(
  "/bulk-delete",
  verifyToken,
  checkPermission("Payment", "canDelete"),
  paymentController.bulkDeletePayment
);

router.get(
  "/total-payable",
  verifyToken,
  paymentController.getTotalPayableAmount
);
// dynamic routes
router.get(
  "/:paymentId",
  verifyToken,
  checkPermission("Payment", "canView"),
  paymentController.getPayment
);

router.put(
  "/:paymentId",
  verifyToken,
  checkPermission("Payment", "canEdit"),
  paymentController.updatePayment
);

router.delete(
  "/:paymentId",
  verifyToken,
  checkPermission("Payment", "canDelete"),
  paymentController.deletePayment
);

module.exports = router;
