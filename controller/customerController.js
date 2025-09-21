const Customer = require("../models/Customer");

// register customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      taxNumber,
      address,
      imgUrl,
      prefix,
      userId,
    } = req.body;

    // Find the last customer with the same prefix
    const lastCustomer = await Customer.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;

    if (lastCustomer && lastCustomer.code) {
      const match = lastCustomer.code.match(/\d+$/); // Extract the numeric part from the code
      if (match) {
        lastSerial = parseInt(match[0], 10);
      }
    }

    // Check for existing entries
    const [existingEmail] = await Promise.all([Customer.findOne({ email })]);

    if (existingEmail) {
      return res.status(400).json({
        message: "Customer already exists. Use another email.",
      });
    }

    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;

    // Create  instance
    const newCustomer = new Customer({
      name,
      email,
      phoneNumber,
      taxNumber,
      address,
      imgUrl,
      code,
      userId,
    });

    const savedCustomer = await newCustomer.save();
    res.status(200).json({
      message: "Customer saved successfully",
      savedCustomer,
    });
  } catch (error) {
    res.status(500).json({ message: `Internal server error ${error}`, error });
  }
};

// GET ALL Customer
exports.fetchCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json(err);
  }
};

// GET Customer detail
exports.fetchCustomer = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const customer = await Customer.findById(customerId);
    res.status(200).json(customer);
  } catch (err) {
    res.status(500).json(err);
  }
};

// update customer
exports.updateCustomer = async (req, res) => {
  try {
    const customerId = req.params.customerId;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(400).json("Customer does not exist");
    }

    const customerUpdate = await Customer.findByIdAndUpdate(
      req.params.customerId,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(customerUpdate);
  } catch (err) {
    res.status(500).json(err);
  }
};

//DELETE
exports.customerDelete = async (req, res) => {
  try {
    const customerId = req.params.customerId;

    // Find customer and delete it
    const customer = await Customer.findByIdAndDelete(customerId);

    return res
      .status(200)
      .json({ customer, message: "Customer deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// BULK DELETE Customers
exports.bulkDeleteCustomers = async (req, res) => {
  try {
    const { ids } = req.body; // expects an array of _id values

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No customer IDs provided." });
    }

    const result = await Customer.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} customers deleted successfully.`,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
