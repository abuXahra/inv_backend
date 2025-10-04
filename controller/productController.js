// const mongoose = require("mongoose");
// const Product = require("../models/Product");

// // Assumes `multer` middleware has processed the file and attached it to `req.file`
// exports.createProduct = async (req, res) => {
//   try {
//     const {
//       title,
//       category,
//       unit,
//       sku,
//       quantityAlert,
//       description,
//       price,
//       tax,
//       taxAmount,
//       unitCost,
//       purchasePrice,
//       taxType,
//       profitMargin,
//       salePrice,
//       quantity, // This represents initial stock
//       prefix,
//       status,
//       userId,
//     } = req.body;

//     // 1. Handle file upload (assuming multer has run)
//     const imgUrl = req.file ? `/uploads/${req.file.filename}` : null;

//     // 2. Validate required fields
//     if (
//       !title ||
//       !category ||
//       !unit ||
//       !quantityAlert ||
//       !description ||
//       !price ||
//       !tax ||
//       !taxAmount ||
//       !unitCost ||
//       !purchasePrice ||
//       !taxType ||
//       !salePrice ||
//       !quantity ||
//       !userId ||
//       !prefix
//     ) {
//       return res
//         .status(400)
//         .json({ message: "Please fill all required fields." });
//     }

//     // 3. Generate product code
//     const lastProduct = await Product.findOne({
//       code: { $regex: `^${prefix}` },
//     })
//       .sort({ code: -1 })
//       .exec();

//     let lastSerial = 0;
//     if (lastProduct && lastProduct.code) {
//       const match = lastProduct.code.match(/\d+$/);
//       if (match) lastSerial = parseInt(match, 10);
//     }
//     const serial = (lastSerial + 1).toString().padStart(4, "0");
//     const code = `${prefix}${serial}`;

//     // 4. Create new Product document
//     const newProduct = new Product({
//       title,
//       category,
//       code,
//       unit,
//       sku,
//       quantityAlert: Number(quantityAlert),
//       description,
//       imgUrl,
//       price: Number(price),
//       tax: Number(tax),
//       taxAmount: Number(taxAmount),
//       unitCost: Number(unitCost),
//       purchasePrice: Number(purchasePrice),
//       taxType,
//       profitMargin: profitMargin ? Number(profitMargin) : 0,
//       salePrice: Number(salePrice),
//       purchaseQuantity: Number(quantity),
//       stockQuantity: Number(quantity), // Initialize stock here
//       saleQuantity: 0,
//       saleReturnQuantity: 0,
//       status,
//       userId,
//     });

//     await newProduct.save();
//     res
//       .status(201)
//       .json({ message: "Product added successfully.", product: newProduct });
//   } catch (error) {
//     console.error("Create Product Error:", error);
//     res.status(500).json({ message: "Something went wrong." });
//   }
// };

// // GET ALL Products
// exports.fetchProducts = async (req, res) => {
//   try {
//     const products = await Product.find()
//       .populate({ path: "unit", select: "title" })
//       .populate({ path: "category", select: "title" });
//     res.status(200).json(products);
//   } catch (err) {
//     console.error("Fetch Products Error:", err);
//     res.status(500).json({ message: "Internal server error." });
//   }
// };

// // GET product detail (corrected to not need lean virtuals)
// exports.fetchProduct = async (req, res) => {
//   try {
//     const productId = req.params.productId;
//     const product = await Product.findById(productId)
//       .populate({ path: "unit", select: "title" })
//       .populate({ path: "category", select: "title" });

//     if (!product) {
//       return res.status(404).json({ message: "Product not found." });
//     }

//     res.status(200).json(product);
//   } catch (err) {
//     console.error("Fetch Product Error:", err);
//     res.status(500).json({ message: "Internal server error." });
//   }
// };

// // update product
// exports.updateProducts = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const productId = req.params.productId;

//     const {
//       title,
//       category,
//       unit,
//       sku,
//       quantityAlert,
//       description,
//       price,
//       tax,
//       taxAmount,
//       unitCost,
//       purchasePrice,
//       taxType,
//       profitMargin,
//       salePrice,
//       status,
//     } = req.body;

//     const updateData = {
//       title,
//       category,
//       unit,
//       sku,
//       quantityAlert,
//       description,
//       price: Number(price),
//       tax: Number(tax),
//       taxAmount: Number(taxAmount),
//       unitCost: Number(unitCost),
//       purchasePrice: Number(purchasePrice),
//       taxType,
//       profitMargin: Number(profitMargin),
//       salePrice: Number(salePrice),
//       status,
//     };

//     if (req.file) {
//       updateData.imgUrl = `/uploads/${req.file.filename}`;
//     }

//     const updatedProduct = await Product.findByIdAndUpdate(
//       productId,
//       { $set: updateData },
//       { new: true, runValidators: true, session }
//     );

//     if (!updatedProduct) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ message: "Product not found." });
//     }

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json(updatedProduct);
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Update Products Error:", err);
//     res.status(500).json({ message: "Internal server error." });
//   }
// };

// //DELETE
// exports.productDelete = async (req, res) => {
//   try {
//     const productId = req.params.productId;

//     const product = await Product.findByIdAndDelete(productId);

//     if (!product) {
//       return res.status(404).json({ message: "Product not found." });
//     }

//     return res
//       .status(200)
//       .json({ product, message: "Product deleted successfully" });
//   } catch (error) {
//     console.error("Product Delete Error:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // BULK DELETE Products
// exports.bulkDeleteProducts = async (req, res) => {
//   try {
//     const { ids } = req.body;

//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "No product IDs provided." });
//     }

//     const result = await Product.deleteMany({ _id: { $in: ids } });

//     res.status(200).json({
//       success: true,
//       message: `${result.deletedCount} Products deleted successfully.`,
//     });
//   } catch (error) {
//     console.error("Bulk delete error:", error);
//     res.status(500).json({ success: false, message: "Internal server error." });
//   }
// };

// controllers/productController.js
const Product = require("../models/Product");

exports.createProduct = async (req, res) => {
  try {
    const {
      title,
      category,
      unit,
      sku,
      quantityAlert,
      description,
      imgUrl,
      price,
      tax,
      taxAmount,
      unitCost,
      purchasePrice,
      taxType,
      profitMargin,
      salePrice,
      quantity,
      prefix,
      status,
      userId,
    } = req.body;

    if (
      !title ||
      !category ||
      !unit ||
      !quantityAlert ||
      !description ||
      !price ||
      !tax ||
      !taxAmount ||
      !unitCost ||
      !purchasePrice ||
      !taxType ||
      !salePrice ||
      !quantity ||
      !userId
    ) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields." });
    }

    // Find the last expense with the same prefix
    const lastProduct = await Product.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;

    if (lastProduct && lastProduct.code) {
      const match = lastProduct.code.match(/\d+$/); // Extract the numeric part from the code
      if (match) {
        lastSerial = parseInt(match[0], 10);
      }
    }
    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;

    const newProduct = new Product({
      title,
      category,
      code,
      unit,
      sku,
      quantityAlert: Number(quantityAlert),
      description,
      imgUrl: imgUrl,
      price: Number(price),
      tax: Number(tax),
      taxAmount: Number(taxAmount),
      unitCost: Number(unitCost),
      purchasePrice: Number(purchasePrice),
      taxType,
      profitMargin: profitMargin ? Number(profitMargin) : 0,
      salePrice: Number(salePrice),
      quantity: Number(quantity),
      status,
      userId,
    });

    await newProduct.save();
    res
      .status(201)
      .json({ message: "Product added successfully.", product: newProduct });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// GET ALL Products
exports.fetchProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate({ path: "unit", select: "title" })
      .populate({ path: "category", select: "title" })
      .lean();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
};

// GET product detail
exports.fetchProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId)
      .populate({ path: "unit", select: "title" })
      .populate({ path: "category", select: "title" })
      .lean({ virtuals: true });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json(err);
  }
};

// update product
exports.updateProducts = async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(400).json("Product does not exist");
    }

    const productUpdate = await Product.findByIdAndUpdate(
      req.params.productId,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(productUpdate);
  } catch (err) {
    res.status(500).json(err);
  }
};

//DELETE
exports.productDelete = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Find product and delete it
    const product = await Product.findByIdAndDelete(productId);

    return res
      .status(200)
      .json({ product, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// BULK DELETE Products
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body; // expects an array of _id values

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No customer IDs provided." });
    }

    const result = await Product.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} Products deleted successfully.`,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
