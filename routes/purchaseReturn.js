const express = require("express");
const router = express.Router();
const purchaseReturnController = require("../controller/purchaseReturnController");
const verifyToken = require("../verifyToken");

// register router
router.post(
  "/create",
  verifyToken,
  purchaseReturnController.purchaseReturnRegister
); //1

// fetch all router
router.get(
  "/",
  verifyToken,
  purchaseReturnController.fetchAllPurchaseReturnReturns
);

// bulk delete router
router.delete(
  "/bulk-delete",
  verifyToken,
  purchaseReturnController.bulkDeletePurchaseReturn
); //4

// update router
router.put(
  "/:returnId",
  verifyToken,
  purchaseReturnController.updatePurchaseReturn
); //2

// fetch router
router.get(
  "/:returnId",
  verifyToken,
  purchaseReturnController.fetchPurchaseReturn
);

// delete router
router.delete(
  "/:returnId",
  verifyToken,
  purchaseReturnController.deletePurchaseReturn
); //3

module.exports = router;
