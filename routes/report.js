const express = require("express");
const router = express.Router();
const reportControllers = require("../controller/reportControllers");

// fetch all sale & purchase report
router.get("/salePurchase", reportControllers.salePurchaseReport);

// fetch all report
router.get("/sale", reportControllers.salePurchaseReport);

module.exports = router;
