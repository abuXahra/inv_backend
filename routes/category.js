const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categoryController");

router.post("/create", categoryController.createCategory);
router.get("/", categoryController.fetchAllCategory);
router.get("/:categoryId", categoryController.fetchCategory);
router.put("/:categoryId", categoryController.categoryUpdate);
router.delete("/:categoryId", categoryController.deleteCategory);

module.exports = router;
