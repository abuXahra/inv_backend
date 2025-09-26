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
