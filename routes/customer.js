const express = require("express");
const router = express.Router();
const customerController = require("../controller/customerController");
const verifyToken = require("../middlewares/verifyToken");
const checkPermission = require("../middlewares/checkPermission");

router.post(
  "/register",
  verifyToken,
  checkPermission("Customer", "canAdd"),
  customerController.createCustomer
);
router.get("/", verifyToken, customerController.fetchCustomers);
// add bulk delete route before the dynamic route
router.delete(
  "/bulk-delete",
  verifyToken,
  checkPermission("Customer", "canDelete"),
  customerController.bulkDeleteCustomers
);
router.get(
  "/:customerId",
  verifyToken,
  checkPermission("Customer", "canView"),
  customerController.fetchCustomer
);
router.put(
  "/:customerId",
  verifyToken,
  checkPermission("Customer", "canEdit"),
  customerController.updateCustomer
);
router.delete(
  "/:customerId",
  verifyToken,
  checkPermission("Customer", "canDelete"),
  customerController.customerDelete
);

module.exports = router;
