const Category = require("../models/Category");

// register category
exports.createCategory = async (req, res) => {
  try {
    const { title, status, note, imgUrl, userId } = req.body;

    // Check for existing entries
    const [existingTitle] = await Promise.all([Category.findOne({ title })]);

    if (existingTitle) {
      return res.status(400).json({
        message: "Category title already exists. Please use another title.",
      });
    }

    // Create  instance
    const newCategory = new Category({
      title,
      status,
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
exports.fetchAllCategory = async (req, res) => {
  try {
    const category = await Category.find({});
    // const category = await Category.find({}).populate("totalProducts");
    res.status(200).json(category);
  } catch (err) {
    res.status(500).json(err);
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
