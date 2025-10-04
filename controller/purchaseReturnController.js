const mongoose = require("mongoose");
const PurchaseReturn = require("../models/PurchaseReturn");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");

// Helper: Generate Code
const generateReturnCode = async (prefix) => {
  const lastReturn = await PurchaseReturn.findOne({
    code: { $regex: `^${prefix}` },
  })
    .sort({ code: -1 })
    .exec();

  let lastSerial = 0;
  if (lastReturn && lastReturn.code) {
    const match = lastReturn.code.match(/\d+$/);
    if (match) lastSerial = parseInt(match[0], 10);
  }
  const serial = (lastSerial + 1).toString().padStart(4, "0");
  return `${prefix}${serial}`;
};

// 📌 Register purchase Return
exports.purchaseReturnRegister = async (req, res) => {
  try {
    const {
      returnDate,
      purchaseId,
      supplier,
      returnAmount,
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
      returnItems = [],
      prefix,
      userId,
    } = req.body;

    // 1️⃣ Find original purchase
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase)
      return res.status(404).json({ message: "purchase not found" });

    // 2️⃣ Validate return items
    for (const item of returnItems) {
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

    // 3️⃣ Generate return code
    const code = await generateReturnCode(prefix);

    // 4️⃣ Clean items
    const cleanedItems = returnItems.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      price: Number(item.price),
      tax: Number(item.tax),
      taxAmount: Number(item.taxAmount),
      amount: Number(item.amount),
    }));

    // 5️⃣ Save return record
    const newReturn = new PurchaseReturn({
      code,
      returnDate,
      purchase: purchaseId,
      supplier,
      returnAmount,
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
      returnItems: cleanedItems,
      userId,
    });

    await newReturn.save();

    // 6️⃣ Update stock
    for (const item of cleanedItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            purchaseReturnQuantity: item.quantity,
            purchaseQuantity: -item.quantity,
            stockQuantity: -item.quantity,
          }, // reduce sold
        },
        { new: true }
      );
    }

    res
      .status(200)
      .json({ message: "purchase return created", return: newReturn });
  } catch (error) {
    console.error("❌ purchase Return Register Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Fetch Single purchase Return
exports.fetchPurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.returnId)
      .populate("purchase", "code purchaseAmount")
      .populate("supplier", "name")
      .populate("userId", "username");

    if (!purchaseReturn)
      return res.status(404).json({ message: "Purchases return not found" });

    res.status(200).json(purchaseReturn);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Fetch All purchase Returns
exports.fetchAllPurchaseReturnReturns = async (req, res) => {
  try {
    const returns = await PurchaseReturn.find({})
      .populate("purchase", "code purchaseAmount")
      .populate("supplier", "name")
      .populate("userId", "username");

    res.status(200).json(returns);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Update purchase Return
exports.updatePurchaseReturn = async (req, res) => {
  try {
    const { returnId } = req.params;
    const {
      returnDate,
      purchaseId,
      supplier,
      returnAmount,
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
      returnItems = [],
      userId,
    } = req.body;

    const purchaseReturn = await PurchaseReturn.findById(returnId);
    if (!purchaseReturn)
      return res.status(404).json({ message: "purchase return not found" });

    // 🔄 Step 1: Rollback old stock
    for (const oldItem of purchaseReturn.returnItems) {
      await Product.findByIdAndUpdate(
        oldItem.productId,
        {
          $inc: {
            purchaseReturnQuantity: -oldItem.quantity,
            purchaseQuantity: oldItem.quantity,
            stockQuantity: -oldItem.quantity,
          },
        },
        { new: true }
      );
    }

    // 🔍 Step 2: Validate new return items
    const purchase = await PurchaseReturn.findById(
      purchaseId || purchaseReturn.purchase
    );
    if (!purchase) {
      return res.status(404).json({ message: "Related sale not found" });
    }

    for (const item of returnItems) {
      const soldItem = purchase.purchaseItems.find(
        (si) => si.productId.toString() === item.productId
      );
      if (!soldItem) {
        return res
          .status(400)
          .json({ message: `Product ${item.title} not found in sale` });
      }
      if (item.quantity > soldItem.quantity) {
        return res.status(400).json({
          message: `Cannot return more than sold quantity for ${item.title}`,
        });
      }
    }

    // 📦 Step 3: Apply new stock
    for (const item of returnItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            purchaseReturnQuantity: item.quantity,
            purchaseQuantity: -item.quantity,
            stockQuantity: -item.quantity,
          },
        },
        { new: true }
      );
    }

    // 📝 Step 4: Update purchase return record
    purchaseReturn.returnDate = returnDate || purchaseReturn.returnDate;
    purchaseReturn.purchase = purchaseId || purchaseReturn.purchase;
    purchaseReturn.supplier = supplier || purchaseReturn.supplier;
    purchaseReturn.returnAmount = returnAmount || purchaseReturn.returnAmount;
    purchaseReturn.invoiceNo = invoiceNo || purchaseReturn.invoiceNo;
    purchaseReturn.reason = reason || purchaseReturn.reason;
    purchaseReturn.paymentType = paymentType || purchaseReturn.paymentType;
    purchaseReturn.paymentStatus =
      paymentStatus || purchaseReturn.paymentStatus;
    purchaseReturn.amountPaid = amountPaid || purchaseReturn.amountPaid;
    purchaseReturn.dueBalance = dueBalance || purchaseReturn.dueBalance;
    purchaseReturn.subTotal = subTotal || purchaseReturn.subTotal;
    purchaseReturn.otherCharges = otherCharges || purchaseReturn.otherCharges;
    purchaseReturn.discount = discount || purchaseReturn.discount;
    purchaseReturn.discountValue =
      discountValue || purchaseReturn.discountValue;
    purchaseReturn.shipping = shipping || purchaseReturn.shipping;
    purchaseReturn.returnItems = returnItems;
    purchaseReturn.userId = userId || purchaseReturn.userId;

    await purchaseReturn.save();

    res.status(200).json({
      message: "purchase return updated successfully",
      return: purchaseReturn,
    });
  } catch (error) {
    console.error("❌ Update purchase Return Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Delete purchase Return
exports.deletePurchaseReturn = async (req, res) => {
  try {
    const { returnId } = req.params;

    const purchaseReturn = await PurchaseReturn.findById(returnId);
    if (!purchaseReturn)
      return res.status(404).json({ message: "purchase return not found" });

    // Rollback stock (remove returned qty from stock)
    for (const item of purchaseReturn.returnItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            purchaseReturnQuantity: -item.quantity,
            purchaseQuantity: item.quantity,
            stockQuantity: item.quantity,
          }, // + added
        },
        { new: true }
      );
    }

    await purchaseReturn.deleteOne();

    res
      .status(200)
      .json({ message: "purchase return deleted and sale restored" });
  } catch (error) {
    console.error("❌ Delete purchase Return Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Bulk Delete purchase Returns
exports.bulkDeletePurchaseReturn = async (req, res) => {
  try {
    const { ids } = req.body; // array of return IDs
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No return IDs provided" });
    }

    const purchaseReturns = await PurchaseReturn.find({ _id: { $in: ids } });

    for (const purchaseReturn of purchaseReturns) {
      // 1️⃣ Rollback stock in Product
      for (const item of purchaseReturn.returnItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              purchaseReturnQuantity: -item.quantity,
              purchaseQuantity: item.quantity,
              stockQuantity: item.quantity,
            },
          },
          { new: true }
        );
      }

      // 2️⃣ Restore quantities back into original Sale.saleItems
      const purchase = await Purchase.findById(PurchaseReturn.purchase);
      if (purchase) {
        purchaseReturn.purchaseItems = purchase.purchaseItems.map((si) => {
          const returnedItem = purchaseReturn.returnItems.find(
            (ri) => ri.productId.toString() === si.productId.toString()
          );
          if (returnedItem) {
            return {
              ...si.toObject(),
              quantity: si.quantity + returnedItem.quantity,
            };
          }
          return si;
        });
        await purchase.save();
      }

      // 3️⃣ Delete the return
      await purchaseReturn.deleteOne();
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
