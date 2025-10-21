const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

router.post(
  "/create",
  verifyToken,
  checkPermission("Product", "canAdd"),
  productController.createProduct
);

router.get("/", verifyToken, productController.fetchProducts);

router.get("/low-stock", verifyToken, productController.fetchLowStockProducts);

// add bulk delete route before the dynamic route

router.delete(
  "/bulk-delete",
  verifyToken,
  checkPermission("Product", "canDelete"),
  productController.bulkDeleteProducts
);
router.get(
  "/:productId",
  verifyToken,
  checkPermission("Product", "canView"),
  productController.fetchProduct
);

router.put(
  "/:productId",
  verifyToken,
  checkPermission("Product", "canEdit"),
  productController.updateProducts
);

router.delete(
  "/:productId",
  verifyToken,
  checkPermission("Product", "canDelete"),
  productController.productDelete
);

module.exports = router;
