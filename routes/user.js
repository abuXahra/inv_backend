const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

//UPDATE
router.put(
  "/:userId",
  verifyToken,
  checkPermission("User", "canEdit"),
  userController.userUpdate
);

//GET SINGLE USER
router.get(
  "/:userId",
  verifyToken,
  checkPermission("User", "canView"),
  userController.userFetch
);

//Delete USER
router.delete(
  "/:userId",
  verifyToken,
  checkPermission("User", "canDelete"),
  userController.userDelete
);

//GET ALL USER
router.get("/", userController.allUsersFetch);
// router.get("/", verifyToken, userController.allUsersFetch);

module.exports = router;
