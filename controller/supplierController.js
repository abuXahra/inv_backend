const Supplier = require("../models/Supplier");

// register supplier
exports.registerSupplier = async (req, res) => {
  try {
    const { name, email, phoneNumber, taxNumber, address, imgUrl, userId } =
      req.body;

    // Check for existing entries
    const [existingEmail] = await Promise.all([Supplier.findOne({ email })]);

    if (existingEmail) {
      return res.status(400).json({
        message: "Supplier already exists. Use another email.",
      });
    }

    // Create  instance
    const newSupplier = new Supplier({
      name,
      email,
      phoneNumber,
      taxNumber,
      address,
      imgUrl,
      userId,
    });

    const savedSupplier = await newSupplier.save();
    res.status(200).json({
      message: "Supplier saved successfully",
      savedSupplier,
    });
  } catch (error) {
    res.status(500).json({ message: `Internal server error ${error}`, error });
  }
};

// register supplier
exports.registerSupplierB = async (req, res) => {
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

    // Find the last expense with the same prefix
    const lastSupplier = await Supplier.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;

    if (lastSupplier && lastSupplier.code) {
      const match = lastSupplier.code.match(/\d+$/); // Extract the numeric part from the code
      if (match) {
        lastSerial = parseInt(match[0], 10);
      }
    }

    // Check for existing entries
    const [existingEmail] = await Promise.all([Supplier.findOne({ email })]);

    if (existingEmail) {
      return res.status(400).json({
        message: "Supplier already exists. Use another email.",
      });
    }

    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;

    // Create  instance
    const newSupplier = new Supplier({
      name,
      email,
      phoneNumber,
      taxNumber,
      address,
      imgUrl,
      code,
      userId,
    });

    const savedSupplier = await newSupplier.save();
    res.status(200).json({
      message: "Supplier saved successfully",
      savedSupplier,
    });
  } catch (error) {
    res.status(500).json({ message: `Internal server error ${error}`, error });
  }
};

// GET ALL
exports.fetchSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.status(200).json(suppliers);
  } catch (err) {
    res.status(500).json(err);
  }
};

// GET detail
exports.fetchSupplier = async (req, res) => {
  try {
    const supplierId = req.params.supplierId;
    const supplier = await Supplier.findById(supplierId);
    res.status(200).json(supplier);
  } catch (err) {
    res.status(500).json(err);
  }
};

// update
exports.updateSupplier = async (req, res) => {
  try {
    const supplierId = req.params.supplierId;

    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      return res.status(400).json("Supplier does not exist");
    }

    const supplierUpdate = await Supplier.findByIdAndUpdate(
      req.params.supplierId,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(supplierUpdate);
  } catch (err) {
    res.status(500).json(err);
  }
};

//DELETE
exports.supplierDelete = async (req, res) => {
  try {
    const supplierId = req.params.supplierId;

    // Find and delete it
    const supplier = await Supplier.findByIdAndDelete(supplierId);

    return res
      .status(200)
      .json({ supplier, message: "Supplier deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// bulk delete
exports.bulkDeleteSuppliers = async (req, res) => {
  try {
    const { ids } = req.body; // expects an array of _id values

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No supplier IDs provided." });
    }

    const result = await Supplier.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} suppliers deleted successfully.`,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
