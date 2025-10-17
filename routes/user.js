const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const verifyToken = require("../verifyToken");

//UPDATE
router.put("/:userId", verifyToken, userController.userUpdate);

//GET SINGLE USER
router.get("/:userId", verifyToken, userController.userFetch);

//Delete USER
router.delete("/:userId", verifyToken, userController.userDelete);

//GET ALL USER
router.get("/", verifyToken, userController.allUsersFetch);

module.exports = router;
