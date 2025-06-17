const express = require("express");
const router = express.Router();
const companyController = require("../controller/companyController");

// register router
router.post("/register", companyController.companyRegister);

// update router
router.put("/:companyId", companyController.companyUpdate);

// fetch router
router.get("/:companyId", companyController.fetchCompany);

// fetch all router
router.get("/", companyController.fetchAllCompany);

// delete router
router.delete("/:companyId", companyController.deleteCompany);

module.exports = router;
