const express = require("express");
const router = express.Router();
const saleController = require("../controller/saleController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

// register router
router.post(
  "/create",
  verifyToken,
  checkPermission("Sale", "canAdd"),
  saleController.saleRegister
);

// fetch all router
router.get("/", verifyToken, saleController.fetchAllSale);

// bulk delete router
router.delete(
  "/bulk-delete",
  verifyToken,
  checkPermission("Sale", "canDelete"),
  saleController.bulkDeleteSale
);

router.get("/payable", verifyToken, saleController.getPayableSales);

router.get("/total-sale", verifyToken, saleController.getTotalSaleAmount);

// router.get("/total-paid", verifyToken, saleController.getTotalAmountPaid);

router.get(
  "/outstanding-sale",
  verifyToken,
  saleController.getTotalOutstandingSales
);

// update router
router.put(
  "/:saleId",
  verifyToken,
  checkPermission("Sale", "canEdit"),
  saleController.saleUpdate
);

// fetch router
router.get(
  "/:saleId",
  verifyToken,
  checkPermission("Sale", "canView"),
  saleController.fetchSale
);

// delete router
router.delete(
  "/:saleId",
  verifyToken,
  checkPermission("Sale", "canDelete"),
  saleController.deleteSale
);

module.exports = router;
