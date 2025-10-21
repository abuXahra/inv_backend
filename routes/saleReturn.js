const express = require("express");
const router = express.Router();
const saleReturnController = require("../controller/saleReturnController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

// register router
router.post(
  "/create",
  verifyToken,
  checkPermission("Sale Return", "canAdd"),
  saleReturnController.salesReturnRegister
); //1

// fetch all router
router.get("/", verifyToken, saleReturnController.fetchAllSalesReturns);

// bulk delete router
router.delete(
  "/bulk-delete",
  verifyToken,
  checkPermission("Sale Return", "canDelete"),
  saleReturnController.bulkDeleteSalesReturns
); //4

// update router
router.put(
  "/:returnId",
  verifyToken,
  checkPermission("Sale Return", "canEdit"),
  saleReturnController.updateSalesReturn
); //2

// fetch router
router.get(
  "/:returnId",
  verifyToken,
  checkPermission("Sale Return", "canView"),
  saleReturnController.fetchSalesReturn
);

// delete router
router.delete(
  "/:returnId",
  verifyToken,
  checkPermission("Sale Return", "canDelete"),
  saleReturnController.deleteSalesReturn
); //3

module.exports = router;
