const mongoose = require("mongoose");
const Wastage = require("../models/Wastage");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");

// Helper: Generate Code
const generateWastageCode = async (prefix) => {
  const lastWaste = await Wastage.findOne({
    code: { $regex: `^${prefix}` },
  })
    .sort({ code: -1 })
    .exec();

  let lastSerial = 0;
  if (lastWaste && lastWaste.code) {
    const match = lastWaste.code.match(/\d+$/);
    if (match) lastSerial = parseInt(match[0], 10);
  }
  const serial = (lastSerial + 1).toString().padStart(4, "0");
  return `${prefix}${serial}`;
};

// 📌 Register Wastage
exports.WastageRegister = async (req, res) => {
  try {
    const {
      wastageDate,
      purchaseId,
      supplier,
      wastageAmount,
      reason,
      invoiceNo,
      paymentType,
      paymentStatus,
      amountPaid,
      dueBalance,
      subTotal,
      otherCharges,
      discount,
      discountValue,
      shipping,
      wastageItems = [],
      prefix,
      userId,
    } = req.body;

    // 1️⃣ Find original purchase
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase)
      return res.status(404).json({ message: "purchase not found" });

    // 2️⃣ Validate waste items
    for (const item of wastageItems) {
      const soldItem = purchase.purchaseItems.find(
        (si) => si.productId.toString() === item.productId
      );

      if (!soldItem) {
        return res.status(400).json({
          message: `Product ${item.title} was not sold in this purchase`,
        });
      }

      if (item.quantity > soldItem.quantity) {
        return res.status(400).json({
          message: `Cannot return more than sold quantity for ${item.title}`,
        });
      }
    }

    // 3️⃣ Generate Wastage code
    const code = await generateWastageCode(prefix);

    // 4️⃣ Clean items
    const cleanedItems = wastageItems.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      price: Number(item.price),
      tax: Number(item.tax),
      taxAmount: Number(item.taxAmount),
      amount: Number(item.amount),
    }));

    // 5️⃣ Save Wastage record
    const newWastage = new Wastage({
      code,
      wastageDate,
      purchase: purchaseId,
      supplier,
      wastageAmount,
      invoiceNo,
      paymentType,
      paymentStatus,
      amountPaid,
      dueBalance,
      subTotal,
      otherCharges,
      discount,
      discountValue,
      shipping,
      reason,
      wastageItems: cleanedItems,
      userId,
    });

    await newWastage.save();

    // 6️⃣ Update stock
    for (const item of cleanedItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            // purchaseReturnQuantity: item.quantity,
            // purchaseQuantity: -item.quantity,
            stockQuantity: -item.quantity,
          }, // reduce sold
        },
        { new: true }
      );
    }

    res
      .status(200)
      .json({ message: "purchase return created", return: newWastage });
  } catch (error) {
    console.error("❌ purchase Return Register Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Fetch Single Wastage
exports.fetchWastage = async (req, res) => {
  try {
    const wastage = await Wastage.findById(req.params.wastageId)
      .populate("purchase", "code purchaseAmount")
      .populate("supplier", "name")
      .populate("userId", "username");

    if (!wastage) return res.status(404).json({ message: "Wastage not found" });

    res.status(200).json(wastage);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Fetch All Wastage
exports.fetchAllWastage = async (req, res) => {
  try {
    const wastage = await Wastage.find({})
      .populate("purchase", "code purchaseAmount")
      .populate("supplier", "name")
      .populate("userId", "username");

    res.status(200).json(wastage);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Update wastage
exports.updateWastage = async (req, res) => {
  try {
    const { wastageId } = req.params;
    const {
      wastageDate,
      purchaseId,
      supplier,
      wastageAmount,
      invoiceNo,
      reason,
      paymentType,
      paymentStatus,
      amountPaid,
      dueBalance,
      subTotal,
      otherCharges,
      discount,
      discountValue,
      shipping,
      wastageItems = [],
      userId,
    } = req.body;

    const wastage = await Wastage.findById(wastageId);
    if (!wastage) return res.status(404).json({ message: "wastage not found" });

    // 🔄 Step 1: Rollback old stock
    for (const oldItem of wastage.returnItems) {
      await Product.findByIdAndUpdate(
        oldItem.productId,
        {
          $inc: {
            // purchaseReturnQuantity: -oldItem.quantity,
            // purchaseQuantity: oldItem.quantity,
            stockQuantity: -oldItem.quantity,
          },
        },
        { new: true }
      );
    }

    // 🔍 Step 2: Validate new return items
    const wastageB = await Wastage.findById(wastageId || wastage.purchase);
    if (!wastageB) {
      return res.status(404).json({ message: "Related purchase not found" });
    }

    for (const item of wastageItems) {
      const wastedItem = wastage.wastageItems.find(
        (si) => si.productId.toString() === item.productId
      );
      if (!wastedItem) {
        return res
          .status(400)
          .json({ message: `Product ${item.title} not found in purchase` });
      }
      if (item.quantity > wastedItem.quantity) {
        return res.status(400).json({
          message: `Cannot return more than sold quantity for ${item.title}`,
        });
      }
    }

    // 📦 Step 3: Apply new stock
    for (const item of wastageItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            // purchaseReturnQuantity: item.quantity,
            // purchaseQuantity: -item.quantity,
            stockQuantity: -item.quantity,
          },
        },
        { new: true }
      );
    }

    // 📝 Step 4: Update purchase return record
    wastage.wastageDate = returnDate || wastage.wastageDate;
    wastage.purchase = purchaseId || wastage.purchase;
    wastage.supplier = supplier || wastage.supplier;
    wastage.wastageAmount = returnAmount || wastage.wastageAmount;
    wastage.invoiceNo = invoiceNo || wastage.invoiceNo;
    wastage.reason = reason || wastage.reason;
    wastage.paymentType = paymentType || wastage.paymentType;
    wastage.paymentStatus = paymentStatus || wastage.paymentStatus;
    wastage.amountPaid = amountPaid || wastage.amountPaid;
    wastage.dueBalance = dueBalance || wastage.dueBalance;
    wastage.subTotal = subTotal || wastage.subTotal;
    wastage.otherCharges = otherCharges || wastage.otherCharges;
    wastage.discount = discount || wastage.discount;
    wastage.discountValue = discountValue || wastage.discountValue;
    wastage.shipping = shipping || wastage.shipping;
    wastage.wastageItems = wastageItems;
    wastage.userId = userId || wastage.userId;

    await wastage.save();

    res.status(200).json({
      message: "wastage  updated successfully",
      return: wastage,
    });
  } catch (error) {
    console.error("❌ Update purchase Return Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Delete Wastage Return
exports.deleteWastage = async (req, res) => {
  try {
    const { wastageId } = req.params;

    const wastage = await Wastage.findById(wastageId);
    if (!wastage) return res.status(404).json({ message: "wastage not found" });

    // Rollback stock (remove returned qty from stock)
    for (const item of wastage.wastageItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            // purchaseReturnQuantity: -item.quantity,
            // purchaseQuantity: item.quantity,
            stockQuantity: item.quantity,
          }, // + added
        },
        { new: true }
      );
    }

    await wastage.deleteOne();

    res.status(200).json({ message: "wastage deleted and sale restored" });
  } catch (error) {
    console.error("❌ Delete wastage Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Bulk Delete wastage
exports.bulkDeleteWastage = async (req, res) => {
  try {
    const { ids } = req.body; // array of return IDs
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No return IDs provided" });
    }

    const wastages = await Wastage.find({ _id: { $in: ids } });

    for (const wastage of wastages) {
      // 1️⃣ Rollback stock in Product
      for (const item of wastage.wastageItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              //   purchaseReturnQuantity: -item.quantity,
              //   purchaseQuantity: item.quantity,
              stockQuantity: item.quantity,
            },
          },
          { new: true }
        );
      }

      // 3️⃣ Delete the return
      await wastage.deleteOne();
    }

    res
      .status(200)
      .json({ message: "Selected purchase returns deleted successfully" });
  } catch (error) {
    console.error("❌ Bulk Delete purchase Returns Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
