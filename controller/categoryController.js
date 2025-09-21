const Category = require("../models/Category");
const Product = require("../models/Product");

// register category
exports.createCategory = async (req, res) => {
  try {
    const { title, status, note, imgUrl, prefix, userId } = req.body;

    // Find the last category with the same prefix
    const lastCategory = await Category.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;

    if (lastCategory && lastCategory.code) {
      const match = lastCategory.code.match(/\d+$/); // Extract the numeric part from the code
      if (match) {
        lastSerial = parseInt(match[0], 10);
      }
    }

    // Check for existing entries
    const [existingTitle] = await Promise.all([Category.findOne({ title })]);

    if (existingTitle) {
      return res.status(400).json({
        message: "Category title already exists. Please use another title.",
      });
    }

    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;

    // Create  instance
    const newCategory = new Category({
      title,
      status,
      code,
      note,
      imgUrl,
      userId,
    });

    const savedCategory = await newCategory.save();
    res.status(200).json({
      message: "Category created successful",
      savedCategory,
    });
  } catch (error) {
    res.status(500).json({ message: `Internal server error ${error}`, error });
  }
};

// fetch category
exports.fetchCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    // const category = await Category.findById(req.params.categoryId).populate("totalProducts");
    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (err) {
    res.status(500).json(err);
  }
};

// fetch all category
// exports.fetchAllCategory = async (req, res) => {
//   try {
//     const category = await Category.find({});
//     // const category = await Category.find({}).populate("totalProducts");
//     res.status(200).json(category);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

// ✅ Fetch all categories along with their total product count

exports.fetchAllCategory = async (req, res) => {
  try {
    // Get all categories
    const categories = await Category.find({}).lean();

    // Count number of products in each category
    const productCounts = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
        },
      },
    ]);

    // Convert counts into a map for quick lookup
    const countsMap = {};
    productCounts.forEach((item) => {
      countsMap[item._id.toString()] = item.total;
    });

    // Add totalProducts to each category
    const categoriesWithProductCount = categories.map((cat) => ({
      ...cat,
      totalProducts: countsMap[cat._id.toString()] || 0,
    }));

    res.status(200).json(categoriesWithProductCount);
  } catch (err) {
    console.error("Error fetching categories with product count", err);
    res.status(500).json({ message: "Server Error", error: err });
  }
};

// ✅ Get a single category and its products
exports.getCategoryWithProducts = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    // Find the category
    const category = await Category.findById(categoryId).lean();
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Find products under this category
    const products = await Product.find({ category: categoryId });

    res.status(200).json({
      category,
      products,
    });
  } catch (error) {
    console.error("Error fetching category with products", error);
    res.status(500).json({ message: "Server error", error });
  }
};

//Update category
exports.categoryUpdate = async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.categoryId,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedCategory);
  } catch (err) {
    res.status(500).json(err);
  }
};

// delete category
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    // Find user and delete it
    const category = await Category.findByIdAndDelete(categoryId);

    return res
      .status(200)
      .json({ category, message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};
