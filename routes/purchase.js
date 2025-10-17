const express = require("express");
const router = express.Router();
const purchaseController = require("../controller/purchaseController");
const verifyToken = require("../verifyToken");

// register router
router.post("/create", verifyToken, purchaseController.purchaseRegister);

// fetch all router
router.get("/", verifyToken, purchaseController.fetchAllPurchase);

// bulk delet router
router.delete(
  "/bulk-delete",
  verifyToken,
  purchaseController.bulkDeletePurchase
);

router.get(
  "/total-purchase",
  verifyToken,
  purchaseController.getTotalPurchaseAmount
);

// update router
router.put("/:purchaseId", verifyToken, purchaseController.purchaseUpdate);

// fetch router
router.get("/:purchaseId", verifyToken, purchaseController.fetchPurchase);

// delete router
router.delete("/:purchaseId", verifyToken, purchaseController.deletePurchase);

module.exports = router;
