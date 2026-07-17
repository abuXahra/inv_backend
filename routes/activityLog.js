const express = require("express");
const router = express.Router();
const activityLogController = require("../controller/activityLogController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

router.get("/", verifyToken, activityLogController.getActivityLogs);

router.delete(
  "/bulk-delete",
  verifyToken,
  activityLogController.bulkDeleteActivityLogs
);

router.delete(
  "/:activityId",
  verifyToken,
  // checkPermission("Audit Log", "canDelete"),
  activityLogController.deleteActivityLog
);

module.exports = router;
