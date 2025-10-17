const express = require("express");
const router = express.Router();
const taxController = require("../controller/taxController");
const verifyToken = require("../verifyToken");

// create
router.post("/create", verifyToken, taxController.createTax);

// fetch all
router.get("/", verifyToken, taxController.fetchAllTax);

// fetch single
router.get("/:taxId", verifyToken, taxController.fetchTax);

// update
router.put("/:taxId", verifyToken, taxController.updateTax);

// delete
router.delete("/:taxId", verifyToken, taxController.deleteTax);

module.exports = router;
