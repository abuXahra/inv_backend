const express = require("express");
const router = express.Router();
const reportControllers = require("../controller/reportControllers");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

// fetch all sale & purchase report
router.get(
  "/salePurchase",
  verifyToken,
  // checkPermission("Generate/View Report", "canView"),
  reportControllers.salePurchaseReport
);

// fetch all report
router.get(
  "/sale",
  verifyToken,
  // checkPermission("Generate/View Report", "canView"),
  reportControllers.saleReports
);

module.exports = router;
