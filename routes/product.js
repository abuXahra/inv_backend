const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");

router.post("/create", productController.createProduct);
router.get("/", productController.fetchProducts);
router.get("/low-stock", productController.fetchLowStockProducts);
// add bulk delete route before the dynamic route
router.delete("/bulk-delete", productController.bulkDeleteProducts);
router.get("/:productId", productController.fetchProduct);
router.put("/:productId", productController.updateProducts);
router.delete("/:productId", productController.productDelete);

module.exports = router;
