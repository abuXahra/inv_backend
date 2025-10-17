const express = require("express");
const router = express.Router();
const saleReturnController = require("../controller/saleReturnController");
const verifyToken = require("../verifyToken");

// register router
router.post("/create", verifyToken, saleReturnController.salesReturnRegister); //1

// fetch all router
router.get("/", verifyToken, saleReturnController.fetchAllSalesReturns);

// bulk delete router
router.delete(
  "/bulk-delete",
  verifyToken,
  saleReturnController.bulkDeleteSalesReturns
); //4

// update router
router.put("/:returnId", verifyToken, saleReturnController.updateSalesReturn); //2

// fetch router
router.get("/:returnId", verifyToken, saleReturnController.fetchSalesReturn);

// delete router
router.delete(
  "/:returnId",
  verifyToken,
  saleReturnController.deleteSalesReturn
); //3

module.exports = router;
