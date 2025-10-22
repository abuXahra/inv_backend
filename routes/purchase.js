const express = require("express");
const router = express.Router();
const purchaseController = require("../controller/purchaseController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

// register router
router.post(
  "/create",
  verifyToken,
  checkPermission("Purchase", "canAdd"),
  purchaseController.purchaseRegister
);

// fetch all router
router.get(
  "/",
  verifyToken,
  checkPermission("Purchase", "canView"),
  purchaseController.fetchAllPurchase
);

// bulk delet router
router.delete(
  "/bulk-delete",
  verifyToken,
  checkPermission("Purchase", "canDelete"),
  purchaseController.bulkDeletePurchase
);

router.get(
  "/total-purchase",
  verifyToken,
  purchaseController.getTotalPurchaseAmount
);

// update router
router.put(
  "/:purchaseId",
  verifyToken,
  checkPermission("Purchase", "canEdit"),
  purchaseController.purchaseUpdate
);

// fetch router
router.get(
  "/:purchaseId",
  verifyToken,
  checkPermission("Purchase", "canView"),
  purchaseController.fetchPurchase
);

// delete router
router.delete(
  "/:purchaseId",
  verifyToken,
  checkPermission("Purchase", "canDelete"),
  purchaseController.deletePurchase
);

module.exports = router;
