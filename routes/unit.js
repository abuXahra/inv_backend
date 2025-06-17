const express = require("express");
const router = express.Router();
const unitController = require("../controller/unitController");

// create
router.post("/create", unitController.createUnit);

// fetch all
router.get("/", unitController.fetchUnits);

// fetch single
router.get("/:unitId", unitController.fetchUnit);

// update
router.put("/:unitId", unitController.updateUnit);

// delete
router.delete("/:unitId", unitController.deleteUnit);

module.exports = router;
