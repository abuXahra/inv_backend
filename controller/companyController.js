const Company = require("../models/Company");
const User = require("../models/User"); // Assuming User model is used for email and name check
const logActivity = require("../utils/activityLogger");

// register company profile
exports.companyRegister = async (req, res) => {
  try {
    const {
      companyName,
      tagLine,
      businessType,
      ownersName,
      mobileNumber,
      phoneNumber,
      faxNumber,
      taxNumber,
      companyEmail,
      currencyCode,
      currencySymbol,
      address,
      companyLogo,
      category,
      product,
      supply,
      purchase,
      customer,
      sale,
      expense,
      saleReturn,
      purchaseReturn,
      wastage,
      userId,
    } = req.body;
    const user = req.user; // comes from verifyToken

    // Check for existing entries
    const [existingCompanyName, existingCompanyEmail] = await Promise.all([
      Company.findOne({ companyName }),
      Company.findOne({ companyEmail }),
    ]);

    if (existingCompanyName) {
      return res.status(400).json({
        message: "Company name already exists. Please use another name.",
      });
    }

    if (existingCompanyEmail) {
      return res.status(400).json({
        message: "Company Email already exists. Please use another email.",
      });
    }

    // Create company instance
    const newCompany = new Company({
      companyName,
      tagLine,
      businessType,
      ownersName,
      mobileNumber,
      phoneNumber,
      faxNumber,
      taxNumber,
      companyEmail,
      currencyCode,
      currencySymbol,
      address,
      companyLogo,
      prefixes: [
        {
          category,
          product,
          supply,
          purchase,
          customer,
          sale,
          expense,
          saleReturn,
          purchaseReturn,
          wastage,
        },
      ],
      userId,
    });

    const savedCompany = await newCompany.save();

    // Activity log
    await logActivity({
      user,
      action: "ADD",
      module: "Company",
      documentId: savedCompany._id,
      description: `Added Company "${savedCompany.companyName}"`,
      newData: {
        title: savedCompany.companyName,
        code: "",
        status: "",
      },
    });

    res.status(200).json({
      message: "Company registration successful",
      savedCompany,
    });
  } catch (error) {
    res.status(500).json({ message: `Internal server error ${error}`, error });
  }
};

// fetch company profile
exports.fetchCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) {
      return res.status(400).json({ message: "Company not found" });
    }
    res.status(200).json(company);
  } catch (err) {
    res.status(500).json(err);
  }
};

// fetch all company
exports.fetchAllCompany = async (req, res) => {
  try {
    const company = await Company.find({});
    res.status(200).json(company);
  } catch (err) {
    res.status(500).json(err);
  }
};

//Update company profile
// exports.companyUpdate = async (req, res) => {
//   try {
//     const updatedCompany = await Company.findByIdAndUpdate(
//       req.params.companyId,
//       { $set: req.body },
//       { new: true }
//     );
//     res.status(200).json(updatedCompany);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

exports.companyUpdate = async (req, res) => {
  try {
    const {
      companyName,
      tagLine,
      businessType,
      ownersName,
      mobileNumber,
      phoneNumber,
      faxNumber,
      taxNumber,
      companyEmail,
      currencyCode,
      currencySymbol,
      address,
      companyLogo,
      category,
      product,
      supply,
      purchase,
      customer,
      sale,
      expense,
      saleReturn,
      purchaseReturn,
      wastage,
      userId,
    } = req.body;

    const companyId = req.params.companyId;
    const user = req.user; // comes from verifyToken

    if (!companyId) {
      return res.status(400).json({ message: "Invalid company ID" });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.companyId,

      {
        companyName,
        tagLine,
        businessType,
        ownersName,
        mobileNumber,
        phoneNumber,
        faxNumber,
        taxNumber,
        companyEmail,
        currencyCode,
        currencySymbol,
        address,
        companyLogo,
        prefixes: [
          {
            category,
            product,
            supply,
            purchase,
            customer,
            sale,
            expense,
            saleReturn,
            purchaseReturn,
            wastage,
          },
        ],
        userId,
      },

      { new: true }
    );
    // Activity log
    await logActivity({
      user,
      action: "UPDATE",
      module: "Company",
      documentId: updatedCompany._id,
      description: `Updated Company "${updatedCompany.companyName}"`,
      newData: {
        title: updatedCompany.companyName,
        code: "",
        status: "",
      },
    });

    res.status(200).json(updatedCompany);
  } catch (err) {
    res.status(500).json(err);
  }
};
// delete company
exports.deleteCompany = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const user = req.user; // comes from verifyToken

    // Find user and delete it
    const company = await Company.findByIdAndDelete(companyId);
    // Activity log
    await logActivity({
      user,
      action: "DELETE",
      module: "Company",
      documentId: company._id,
      description: `Deleted category "${company.title}"`,
      newData: {
        title: company.title,
        code: "",
        status: "",
      },
    });
    return res
      .status(200)
      .json({ company, message: "Company deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};
