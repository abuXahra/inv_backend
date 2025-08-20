const express = require("express");
const router = express.Router();
const saleController = require("../controller/saleController");

// register router
router.post("/create", saleController.saleRegister);

// fetch all router
router.get("/", saleController.fetchAllSale);

// bulk delete router
router.delete("/bulk-delete", saleController.bulkDeleteSale);

// update router
router.put("/:saleId", saleController.saleUpdate);

// fetch router
router.get("/:saleId", saleController.fetchSale);

// delete router
router.delete("/:saleId", saleController.deleteSale);

router.get("/payable", saleController.getPayableSales);

module.exports = router;
