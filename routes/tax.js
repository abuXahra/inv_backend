const express = require("express");
const router = express.Router();
const taxController = require("../controller/taxController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

// create
router.post(
  "/create",
  verifyToken,
  checkPermission("Tax", "canAdd"),
  taxController.createTax
);

// fetch all
router.get("/", verifyToken, taxController.fetchAllTax);

// fetch single
router.get(
  "/:taxId",
  verifyToken,
  checkPermission("Tax", "canView"),
  taxController.fetchTax
);

// update
router.put(
  "/:taxId",
  verifyToken,
  checkPermission("Tax", "canEdit"),
  taxController.updateTax
);

// delete
router.delete(
  "/:taxId",
  verifyToken,
  checkPermission("Tax", "canDelete"),
  taxController.deleteTax
);

module.exports = router;
