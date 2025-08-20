const { default: mongoose } = require("mongoose");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");

// register Purchase data
exports.purchaseRegister = async (req, res) => {
  try {
    const {
      purchaseDate,
      supplier,
      purchaseStatus,
      reference,
      purchaseAmount,
      paymentType,
      paymentStatus,
      amountPaid,
      dueBalance,
      note,
      subTotal,
      otherCharges,
      discount,
      discountValue,
      shipping,
      purchaseItems = [],
      prefix,
      userId,
    } = req.body;

    // Find the last expense with the same prefix
    const lastPurchase = await Purchase.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;

    if (lastPurchase && lastPurchase.code) {
      const match = lastPurchase.code.match(/\d+$/); // Extract the numeric part from the code
      if (match) {
        lastSerial = parseInt(match[0], 10);
      }
    }
    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;

    // Purchase Item
    const cleanedItems = purchaseItems.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: Number(item.quantity),
      price: Number(item.price),
      tax: Number(item.tax),
      taxAmount: Number(item.taxAmount),
      unitCost: Number(item.unitCost),
      amount: Number(item.amount),
    }));
    console.log("🧾 Received Purchase Items:", purchaseItems);
    console.log("🧾 Processed Items:", cleanedItems);
    console.log("🧾 Creating purchase with data:");
    // Create purchase instance
    const newPurchase = new Purchase({
      code,
      purchaseDate,
      supplier,
      purchaseStatus,
      reference,
      purchaseAmount,
      paymentType,
      paymentStatus,
      amountPaid,
      dueBalance,
      note,
      subTotal,
      otherCharges,
      discount,
      discountValue,
      shipping,
      userId,
      purchaseItems: cleanedItems,
    });

    await newPurchase.save();

    // loop through the purchase Items and increase the product purchase quantity accordingly
    for (const item of cleanedItems) {
      // check if is valid productId
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        console.error("❌ Invalid productId:", item.productId);
        continue;
      }

      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { purchaseQuantity: item.quantity } },
        { new: true }
      );
    }

    res.status(200).json({
      message: "Purchase saved successful",
      newPurchase,
    });
  } catch (error) {
    console.error("❌ Purchase Register Error:", error); // Full error object
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// fetch Purchase data
exports.fetchPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.purchaseId)
      .populate({
        path: "userId",
        select: "username",
      })
      .populate({
        path: "supplier",
        select: "name",
      });
    if (!purchase) {
      return res.status(400).json({ message: "Purchase not found" });
    }
    res.status(200).json(purchase);
  } catch (err) {
    res.status(500).json(err);
  }
};

// fetch all purchase
exports.fetchAllPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.find({})
      .populate({
        path: "userId",
        select: "username",
      })
      .populate({
        path: "supplier",
        select: "name",
      });
    res.status(200).json(purchase);
  } catch (err) {
    res.status(500).json(err);
  }
};

//Update purchase data
// exports.purchaseUpdate = async (req, res) => {
//   try {
//     const updatedPurchase = await Purchase.findByIdAndUpdate(
//       req.params.purchaseId,
//       { $set: req.body },
//       { new: true }
//     );
//     res.status(200).json(updatedPurchase);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

// Update Purchase
exports.purchaseUpdate = async (req, res) => {
  try {
    const {
      purchaseDate,
      supplier,
      purchaseStatus,
      reference,
      purchaseAmount,
      paymentType,
      paymentStatus,
      amountPaid,
      dueBalance,
      note,
      subTotal,
      otherCharges,
      discount,
      discountValue,
      shipping,
      purchaseItems = [],
      userId,
    } = req.body;

    const purchaseId = req.params.purchaseId;

    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
      return res.status(400).json({ message: "Invalid purchase ID" });
    }

    // 1️⃣ Get the old purchase so we can rollback stock
    const oldPurchase = await Purchase.findById(purchaseId);
    if (!oldPurchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // 2️⃣ Rollback previous purchase quantities
    for (const item of oldPurchase.purchaseItems) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { purchaseQuantity: -item.quantity } }, // rollback
        { new: true }
      );
    }

    // 3️⃣ Clean and sanitize new items
    const cleanedItems = purchaseItems.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: Number(item.quantity),
      price: Number(item.price),
      tax: Number(item.tax),
      taxAmount: Number(item.taxAmount),
      unitCost: Number(item.unitCost),
      amount: Number(item.amount),
    }));

    // 4️⃣ Update the purchase
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      purchaseId,
      {
        purchaseDate,
        supplier,
        purchaseStatus,
        reference,
        purchaseAmount,
        paymentType,
        paymentStatus,
        amountPaid,
        dueBalance,
        note,
        subTotal,
        otherCharges,
        discount,
        discountValue,
        shipping,
        purchaseItems: cleanedItems,
        userId,
      },
      { new: true }
    );

    // 5️⃣ Add the new quantities
    for (const item of cleanedItems) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;

      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { purchaseQuantity: item.quantity } },
        { new: true }
      );
    }

    res.status(200).json({
      message: "Purchase updated successfully",
      updatedPurchase,
    });
  } catch (error) {
    console.error("❌ Purchase Update Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// delete purchase
exports.deletePurchase = async (req, res) => {
  try {
    const purchaseId = req.params.purchaseId;

    // Find user and delete it
    const purchase = await Purchase.findByIdAndDelete(purchaseId);

    return res
      .status(200)
      .json({ purchase, message: "Purchase deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};

// BULK DELETE Purchase
exports.bulkDeletePurchase = async (req, res) => {
  try {
    const { ids } = req.body; // expects an array of _id values

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No Purchase IDs provided." });
    }

    const result = await Purchase.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} Purchase deleted successfully.`,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
