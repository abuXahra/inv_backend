const express = require("express");
const router = express.Router();
const wastageController = require("../controller/wastageController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

// register router
router.post(
  "/create",
  verifyToken,
  checkPermission("Wastage", "canAdd"),
  wastageController.WastageRegister
); //1

// fetch all router
router.get("/", verifyToken, wastageController.fetchAllWastage);

// bulk delete router
router.delete(
  "/bulk-delete",
  verifyToken,
  checkPermission("Wastage", "canDelete"),
  wastageController.bulkDeleteWastage
); //4

// update router
router.put(
  "/:wastageId",
  verifyToken,
  checkPermission("Wastage", "canEdit"),
  wastageController.updateWastage
); //2

// fetch router
router.get(
  "/:wastageId",
  verifyToken,
  checkPermission("Wastage", "canView"),
  wastageController.fetchWastage
);

// delete router
router.delete(
  "/:wastageId",
  verifyToken,
  checkPermission("Wastage", "canDelete"),
  wastageController.deleteWastage
); //3

module.exports = router;
