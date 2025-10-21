const express = require("express");
const router = express.Router();
const unitController = require("../controller/unitController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

// create
router.post(
  "/create",
  verifyToken,
  checkPermission("Unit", "canAdd"),
  unitController.createUnit
);

// fetch all
router.get("/", verifyToken, unitController.fetchUnits);

// fetch single
router.get(
  "/:unitId",
  verifyToken,
  checkPermission("Unit", "canView"),
  unitController.fetchUnit
);

// update
router.put(
  "/:unitId",
  verifyToken,
  checkPermission("Unit", "canEdit"),
  unitController.updateUnit
);

// delete
router.delete(
  "/:unitId",
  verifyToken,
  checkPermission("Unit", "canDelete"),
  unitController.deleteUnit
);

module.exports = router;
