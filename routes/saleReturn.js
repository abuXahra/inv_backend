const express = require("express");
const router = express.Router();
const saleReturnController = require("../controller/saleReturnController");

// register router
router.post("/create", saleReturnController.salesReturnRegister); //1

// fetch all router
router.get("/", saleReturnController.fetchAllSalesReturns);

// bulk delete router
router.delete("/bulk-delete", saleReturnController.bulkDeleteSalesReturns); //4

// update router
router.put("/:returnId", saleReturnController.updateSalesReturn); //2

// fetch router
router.get("/:returnId", saleReturnController.fetchSalesReturn);

// delete router
router.delete("/:returnId", saleReturnController.deleteSalesReturn); //3

module.exports = router;
