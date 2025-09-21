const express = require("express");
const router = express.Router();
const saleReturnController = require("../controller/saleReturnController");

// register router
router.post("/create", saleReturnController.salesReturnRegister);

// fetch all router
router.get("/", saleReturnController.fetchAllSalesReturns);

// bulk delete router
// router.delete("/bulk-delete", saleReturnController.bulkDeleteSale);

// update router
router.put("/:returnId", saleReturnController.updateSalesReturn);

// fetch router
router.get("/:returnId", saleReturnController.fetchSalesReturn);

// delete router
router.delete("/:returnId", saleReturnController.deleteSalesReturn);

module.exports = router;
