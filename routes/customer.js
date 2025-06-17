const express = require("express");
const router = express.Router();
const customerController = require("../controller/customerController");

router.post("/register", customerController.createCustomer);
router.get("/", customerController.fetchCustomers);
// add bulk delete route before the dynamic route
router.delete("/bulk-delete", customerController.bulkDeleteCustomers);
router.get("/:customerId", customerController.fetchCustomer);
router.put("/:customerId", customerController.updateCustomer);
router.delete("/:customerId", customerController.customerDelete);

module.exports = router;
