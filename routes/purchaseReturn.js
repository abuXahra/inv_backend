const express = require("express");
const router = express.Router();
const purchaseReturnController = require("../controller/purchaseReturnController");

// register router
router.post("/create", purchaseReturnController.purchaseReturnRegister); //1

// fetch all router
router.get("/", purchaseReturnController.fetchAllPurchaseReturnReturns);

// bulk delete router
router.delete(
  "/bulk-delete",
  purchaseReturnController.bulkDeletePurchaseReturn
); //4

// update router
router.put("/:returnId", purchaseReturnController.updatePurchaseReturn); //2

// fetch router
router.get("/:returnId", purchaseReturnController.fetchPurchaseReturn);

// delete router
router.delete("/:returnId", purchaseReturnController.deletePurchaseReturn); //3

module.exports = router;
