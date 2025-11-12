const Company = require("../models/Company");
const User = require("../models/User"); // Assuming User model is used for email and name check

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
    res.status(200).json(updatedCompany);
  } catch (err) {
    res.status(500).json(err);
  }
};
// delete company
exports.deleteCompany = async (req, res) => {
  try {
    const companyId = req.params.companyId;

    // Find user and delete it
    const company = await Company.findByIdAndDelete(companyId);

    return res
      .status(200)
      .json({ company, message: "Company deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};
