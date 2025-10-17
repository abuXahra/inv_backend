const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categoryController");
const verifyToken = require("../verifyToken");

router.post("/create", verifyToken, categoryController.createCategory);
router.get("/", verifyToken, categoryController.fetchAllCategory);
router.get("/:categoryId", verifyToken, categoryController.fetchCategory);
router.put("/:categoryId", verifyToken, categoryController.categoryUpdate);
router.delete("/:categoryId", verifyToken, categoryController.deleteCategory);
router.get(
  "/:categoryId/products",
  verifyToken,
  categoryController.getCategoryWithProducts
);

module.exports = router;
