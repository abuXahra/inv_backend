const express = require("express");
const router = express.Router();
const saleController = require("../controller/saleController");
const verifyToken = require("../verifyToken");

// register router
router.post("/create", verifyToken, saleController.saleRegister);

// fetch all router
router.get("/", verifyToken, saleController.fetchAllSale);

router.get("/payable", verifyToken, saleController.getPayableSales);

router.get("/total-sale", verifyToken, saleController.getTotalSaleAmount);

// bulk delete router
router.delete("/bulk-delete", verifyToken, saleController.bulkDeleteSale);

// update router
router.put("/:saleId", verifyToken, saleController.saleUpdate);

// fetch router
router.get("/:saleId", verifyToken, saleController.fetchSale);

// delete router
router.delete("/:saleId", verifyToken, saleController.deleteSale);

module.exports = router;
