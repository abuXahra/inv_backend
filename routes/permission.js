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
  permissionController.addPermissionModule,
);

router.get(
  "/",
  verifyToken,
  checkPermission("Permission", "canView"),
  permissionController.getAllPermissions,
);

router.get(
  "/:permissionId",
  verifyToken,
  checkPermission("Permission", "canView"),
  permissionController.getSinglePermissions,
);

router.put(
  "/update-all",
  verifyToken,
  checkPermission("Permission", "canEdit"),
  permissionController.updateAllPermissions,
);

router.put(
  "/:permissionId",
  verifyToken,
  checkPermission("Permission", "canEdit"),
  permissionController.updateSinglePermission,
);

router.delete(
  "/:permissionId",
  verifyToken,
  checkPermission("Permission", "canDelete"),
  permissionController.deletePermission,
);

module.exports = router;
