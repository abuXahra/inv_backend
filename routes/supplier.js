const express = require("express");
const router = express.Router();
const supplierController = require("../controller/supplierController");
const verifyToken = require("../verifyToken");

router.post("/register", verifyToken, supplierController.registerSupplier);
router.get("/", verifyToken, supplierController.fetchSuppliers);
// add bulk delete route before the dynamic route
router.delete(
  "/bulk-delete",
  verifyToken,
  supplierController.bulkDeleteSuppliers
);
router.get("/:supplierId", verifyToken, supplierController.fetchSupplier);
router.put("/:supplierId", verifyToken, supplierController.updateSupplier);
router.delete("/:supplierId", verifyToken, supplierController.supplierDelete);

module.exports = router;
