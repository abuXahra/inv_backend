const express = require("express");
const router = express.Router();
const taxController = require("../controller/taxController");

// create
router.post("/create", taxController.createTax);

// fetch all
router.get("/", taxController.fetchAllTax);

// fetch single
router.get("/:taxId", taxController.fetchTax);

// update
router.put("/:taxId", taxController.updateTax);

// delete
router.delete("/:taxId", taxController.deleteTax);

module.exports = router;
