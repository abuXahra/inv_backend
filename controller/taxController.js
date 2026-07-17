const Tax = require("../models/Tax");
const logActivity = require("../utils/activityLogger");

// create tax
exports.createTax = async (req, res) => {
  const { name, taxPercentage, status } = req.body;

  try {
    const existingTitle = await Tax.findOne({ name });

    if (existingTitle) {
      return res
        .status(400)
        .json({ message: "Tax name already exist. Please use another name" });
    }

    const newTax = new Tax({
      name,
      taxPercentage: parseFloat(taxPercentage),
      status,
    });

    const savedTax = await newTax.save();

    // Activity log
    await logActivity({
      user: req.user,
      action: "ADD",
      module: "Tax",
      documentId: savedTax._id,
      description: `Added tax "${savedTax.name}"`,
      newData: {
        title: savedTax.name,
        code: savedTax.code,
        status: "",
      },
    });

    res.status(200).json({ savedTax, message: "created successfully" });
  } catch (error) {
    console.log(error);
  }
};

// get all tax
exports.fetchAllTax = async (req, res) => {
  try {
    const tax = await Tax.find({});
    res.status(200).json(tax);
  } catch (error) {
    console.log(error);
  }
};

// get tax
exports.fetchTax = async (req, res) => {
  const taxId = req.params.taxId;
  try {
    const tax = await Tax.findById(taxId);
    res.status(200).json(tax);
  } catch (error) {
    console.log(error);
  }
};

// update tax
exports.updateTax = async (req, res) => {
  try {
    const updatedTax = await Tax.findByIdAndUpdate(
      req.params.taxId,
      { $set: req.body },
      { new: true },
    );
    // Activity log
    await logActivity({
      user: req.user,
      action: "UPDATE",
      module: "Tax",
      documentId: updatedTax._id,
      description: `Tax "${updatedTax.name}" updated`,
      newData: {
        title: updatedTax.expenseFor,
        code: updatedTax.code,
        status: "",
      },
    });

    res.status(200).json(updatedTax);
  } catch (err) {
    res.status(500).json(err);
  }
};

// delete unit
exports.deleteTax = async (req, res) => {
  try {
    const taxId = req.params.taxId;
    const tax = await Tax.findByIdAndDelete(taxId);

    // Activity log
    await logActivity({
      user: req.user,
      action: "DELETE",
      module: "Tax",
      documentId: tax._id,
      description: `Deleted a Tax "${tax.name}"`,
      newData: {
        title: tax.name,
        code: tax.code,
        status: "",
      },
    });

    return res.status(200).json({ tax, message: "Unit deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};
