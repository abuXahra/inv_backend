const express = require("express");
const router = express.Router();
const purchaseController = require("../controller/purchaseController");

// register router
router.post("/create", purchaseController.purchaseRegister);

// fetch all router
router.get("/", purchaseController.fetchAllPurchase);

// bulk delet router
router.delete("/bulk-delete", purchaseController.bulkDeletePurchase);

// update router
router.put("/:purchaseId", purchaseController.purchaseUpdate);

// fetch router
router.get("/:purchaseId", purchaseController.fetchPurchase);

// delete router
router.delete("/:purchaseId", purchaseController.deletePurchase);

module.exports = router;
