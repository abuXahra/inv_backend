// routes/permission.js
const express = require("express");
const router = express.Router();
const permissionController = require("../controller/permissionController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

router.post(
  "/add",
  verifyToken,
  checkPermission("Permission", "canAdd"),
  permissionController.addPermissionModule
);

router.get(
  "/",
  verifyToken,
  checkPermission("Permission", "canView"),
  permissionController.getAllPermissions
);

router.put(
  "/update-all",
  verifyToken,
  checkPermission("Permission", "canEdit"),
  permissionController.updateAllPermissions
);

module.exports = router;
