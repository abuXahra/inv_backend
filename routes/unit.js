const express = require("express");
const router = express.Router();
const unitController = require("../controller/unitController");
const verifyToken = require("../verifyToken");

// create
router.post("/create", verifyToken, unitController.createUnit);

// fetch all
router.get("/", verifyToken, unitController.fetchUnits);

// fetch single
router.get("/:unitId", verifyToken, unitController.fetchUnit);

// update
router.put("/:unitId", verifyToken, unitController.updateUnit);

// delete
router.delete("/:unitId", verifyToken, unitController.deleteUnit);

module.exports = router;
