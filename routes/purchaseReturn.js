const express = require("express");
const router = express.Router();
const purchaseReturnController = require("../controller/purchaseReturnController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

// register router
router.post(
  "/create",
  verifyToken,
  checkPermission("Purchase Return", "canAdd"),
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
  checkPermission("Purchase Return", "canDelete"),
  purchaseReturnController.bulkDeletePurchaseReturn
); //4

// update router
router.put(
  "/:returnId",
  verifyToken,
  checkPermission("Purchase Return", "canEdit"),
  purchaseReturnController.updatePurchaseReturn
); //2

// fetch router
router.get(
  "/:returnId",
  verifyToken,
  checkPermission("Purchase Return", "canView"),
  purchaseReturnController.fetchPurchaseReturn
);

// delete router
router.delete(
  "/:returnId",
  verifyToken,
  checkPermission("Purchase Return", "canDelete"),
  purchaseReturnController.deletePurchaseReturn
); //3

module.exports = router;
