const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categoryController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

router.post(
  "/create",
  verifyToken,
  checkPermission("Category", "canAdd"),
  categoryController.createCategory
);

router.get(
  "/",
  verifyToken,
  // checkPermission("Category", "canView"),
  categoryController.fetchAllCategory
);

router.get(
  "/:categoryId",
  verifyToken,
  checkPermission("Category", "canView"),
  categoryController.fetchCategory
);

router.put(
  "/:categoryId",
  verifyToken,
  checkPermission("Category", "canEdit"),
  categoryController.categoryUpdate
);

router.delete(
  "/:categoryId",
  verifyToken,
  checkPermission("Category", "canDelete"),
  categoryController.deleteCategory
);

router.get(
  "/:categoryId/products",
  verifyToken,
  checkPermission("Category", "canView"),
  categoryController.getCategoryWithProducts
);

module.exports = router;
