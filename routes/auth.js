const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const verifyToken = require("../middlewares/verifyToken");

//REGISTER
router.post("/register", authController.userRegister);

//LOGIN
router.post("/login", authController.userLogin);

//LOGOUT
router.get("/logout", authController.userLogout);

//REFETCH USER
// router.get("/refetch", authController.getUserInfo);

//REFETCH USER
router.get("/me", verifyToken, authController.getUserInfo);

module.exports = router;
