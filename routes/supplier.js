const express = require("express");
const router = express.Router();
const supplierController = require("../controller/supplierController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

router.post(
  "/register",
  verifyToken,
  checkPermission("Supplier", "canAdd"),
  supplierController.registerSupplier
);

router.get("/", verifyToken, supplierController.fetchSuppliers);

// add bulk delete route before the dynamic route
router.delete(
  "/bulk-delete",
  verifyToken,
  checkPermission("Supplier", "canDelete"),
  supplierController.bulkDeleteSuppliers
);

router.get(
  "/:supplierId",
  verifyToken,
  checkPermission("Supplier", "canView"),
  supplierController.fetchSupplier
);

router.put(
  "/:supplierId",
  verifyToken,
  checkPermission("Supplier", "canEdit"),
  supplierController.updateSupplier
);

router.delete(
  "/:supplierId",
  verifyToken,
  checkPermission("Supplier", "canDelete"),
  supplierController.supplierDelete
);

module.exports = router;
