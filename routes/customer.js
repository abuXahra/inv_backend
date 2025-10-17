const express = require("express");
const router = express.Router();
const customerController = require("../controller/customerController");
const verifyToken = require("../verifyToken");

router.post("/register", verifyToken, customerController.createCustomer);
router.get("/", verifyToken, customerController.fetchCustomers);
// add bulk delete route before the dynamic route
router.delete(
  "/bulk-delete",
  verifyToken,
  customerController.bulkDeleteCustomers
);
router.get("/:customerId", verifyToken, customerController.fetchCustomer);
router.put("/:customerId", verifyToken, customerController.updateCustomer);
router.delete("/:customerId", verifyToken, customerController.customerDelete);

module.exports = router;
