// routes/permission.js
const express = require("express");
const router = express.Router();
const permissionController = require("../controller/permissionController");
const verifyToken = require("../verifyToken");

router.post("/add", verifyToken, permissionController.addPermissionModule);

router.get("/", verifyToken, permissionController.getAllPermissions);

router.put(
  "/update-all",
  verifyToken,
  permissionController.updateAllPermissions
);

module.exports = router;
