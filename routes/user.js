const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

//UPDATE
router.put("/:userId", userController.userUpdate);

//GET SINGLE USER
router.get("/:userId", userController.userFetch);

//Delete USER
router.delete("/:userId", userController.userDelete);

//GET ALL USER
router.get("/", userController.allUsersFetch);

module.exports = router;
