const express = require("express");
const router = express.Router();
const companyController = require("../controller/companyController");
const verifyToken = require("../verifyToken");

// register router
router.post("/register", verifyToken, companyController.companyRegister);

// update router
router.put("/:companyId", verifyToken, companyController.companyUpdate);

// fetch router
router.get("/:companyId", verifyToken, companyController.fetchCompany);

// fetch all router
router.get("/", verifyToken, companyController.fetchAllCompany);

// delete router
router.delete("/:companyId", verifyToken, companyController.deleteCompany);

module.exports = router;
