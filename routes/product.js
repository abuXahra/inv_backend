const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const verifyToken = require("../verifyToken");

router.post("/create", verifyToken, productController.createProduct);
router.get("/", verifyToken, productController.fetchProducts);
router.get("/low-stock", verifyToken, productController.fetchLowStockProducts);
// add bulk delete route before the dynamic route
router.delete(
  "/bulk-delete",
  verifyToken,
  productController.bulkDeleteProducts
);
router.get("/:productId", verifyToken, productController.fetchProduct);
router.put("/:productId", verifyToken, productController.updateProducts);
router.delete("/:productId", verifyToken, productController.productDelete);

module.exports = router;
