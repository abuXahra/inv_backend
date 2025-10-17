const express = require("express");
const router = express.Router();
const reportControllers = require("../controller/reportControllers");
const verifyToken = require("../verifyToken");

// fetch all sale & purchase report
router.get("/salePurchase", verifyToken, reportControllers.salePurchaseReport);

// fetch all report
router.get("/sale", verifyToken, reportControllers.salePurchaseReport);

module.exports = router;
