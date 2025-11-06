const mongoose = require("mongoose");
const Wastage = require("../models/Wastage");
const Product = require("../models/Product");

// ✅ Create wastage (single or multiple)
exports.createWastage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const data = req.body;
    const prefix = data.prefix;

    // Find last wastage with same prefix
    const lastWastage = await Wastage.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;
    if (lastWastage && lastWastage.code) {
      const match = lastWastage.code.match(/\d+$/);
      if (match) {
        lastSerial = parseInt(match[0], 10);
      }
    }

    // 🧮 Helper: adjust stock
    const adjustProductStock = async (productId, qtyChange, wasteChange) => {
      const product = await Product.findById(productId).session(session);
      if (!product) throw new Error("Product not found");
      product.stockQuantity += qtyChange; // qtyChange will be negative for wastage creation
      product.wasteQuantity += wasteChange;
      await product.save({ session });
    };

    let savedWastages = [];

    if (Array.isArray(data.items)) {
      // 🔁 For multiple wastage items
      const newWastages = data.items.map((item, index) => {
        const serial = (lastSerial + index + 1).toString().padStart(4, "0");
        const code = `${prefix}${serial}`;
        return { ...item, code };
      });

      // Save wastages and adjust product stock
      savedWastages = await Wastage.insertMany(newWastages, { session });

      for (const item of newWastages) {
        await adjustProductStock(item.productId, -item.quantity, item.quantity);
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        message: "Wastages added successfully",
        wastages: savedWastages,
      });
    }

    // 🧾 Single wastage item
    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;
    const newWastage = new Wastage({ ...data, code });

    const savedWastage = await newWastage.save({ session });
    await adjustProductStock(data.productId, -data.quantity, data.quantity);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Wastage added successfully",
      wastage: savedWastage,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating wastage:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete a single wastage and reverse product stock
exports.deleteWastage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wastage = await Wastage.findById(req.params.id).session(session);
    if (!wastage) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Wastage not found" });
    }

    const product = await Product.findById(wastage.productId).session(session);
    if (product) {
      product.stockQuantity += wastage.quantity;
      product.wasteQuantity -= wastage.quantity;
      await product.save({ session });
    }

    await wastage.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Wastage deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting wastage:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Bulk delete wastages and reverse product stock for all
exports.bulkDeleteWastage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No wastage IDs provided" });
    }

    const wastages = await Wastage.find({ _id: { $in: ids } }).session(session);

    for (const w of wastages) {
      const product = await Product.findById(w.productId).session(session);
      if (product) {
        product.stockQuantity += w.quantity;
        product.wasteQuantity -= w.quantity;
        await product.save({ session });
      }
    }

    await Wastage.deleteMany({ _id: { $in: ids } }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Selected wastages deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting wastages:", error);
    res.status(500).json({ message: "Server error" });
  }
};
