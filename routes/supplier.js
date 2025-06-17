const express = require("express");
const router = express.Router();
const supplierController = require("../controller/supplierController");

router.post("/register", supplierController.registerSupplierB);
router.get("/", supplierController.fetchSuppliers);
// add bulk delete route before the dynamic route
router.delete("/bulk-delete", supplierController.bulkDeleteSuppliers);
router.get("/:supplierId", supplierController.fetchSupplier);
router.put("/:supplierId", supplierController.updateSupplier);
router.delete("/:supplierId", supplierController.supplierDelete);

module.exports = router;
