const { default: mongoose } = require("mongoose");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const PurchaseReturn = require("../models/PurchaseReturn");
const Wastage = require("../models/Wastage");
const logActivity = require("../utils/activityLogger");

// register Purchase data
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

    const user = req.user; // comes from verifyToken
    // Find last purchase with same prefix
    const lastPurchase = await Purchase.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;
    if (lastPurchase && lastPurchase.code) {
      const match = lastPurchase.code.match(/\d+$/);
      if (match) lastSerial = parseInt(match[0], 10);
    }

    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;

    // Clean items
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

    // Create purchase
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

    // Payment calculations
    if (paymentStatus === "unpaid") {
      newPurchase.amountPaid = 0;
      newPurchase.dueBalance = newPurchase.purchaseAmount;
    } else if (paymentStatus === "paid") {
      newPurchase.amountPaid = newPurchase.purchaseAmount;
      newPurchase.dueBalance = 0;
    } else if (paymentStatus === "partial") {
      newPurchase.dueBalance =
        newPurchase.purchaseAmount - (newPurchase.amountPaid || 0);
    }

    await newPurchase.save();

    // CREATE PAYMENT RECORD
    if (paymentStatus === "paid" || paymentStatus === "partial") {
      await Payment.create({
        paymentDate: purchaseDate,
        paymentFor: code,
        invoiceNo: code,
        dueBalance: newPurchase.dueBalance,
        payableAmount: newPurchase.amountPaid,
        paymentType,
        note,
        userId,
      });
    }

    // Increase stock
    for (const item of cleanedItems) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;

      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            purchaseQuantity: item.quantity,
            stockQuantity: item.quantity,
          },
        },
        { new: true },
      );
    }

    // Activity log
    await logActivity({
      user,
      action: "ADD",
      module: "Purchase",
      documentId: newPurchase._id,
      description: `Added a purchase "${newPurchase.code}"`,
      newData: {
        title: newPurchase.code,
        code: newPurchase.code,
        status: "",
      },
    });

    res.status(200).json({
      message: "Purchase saved successfully",
      newPurchase,
    });
  } catch (error) {
    console.error("❌ Purchase Register Error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
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
      })
      .sort({ createdAt: -1 });

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

// ========================================
// fetch all sales for a particular customer
// ========================================
exports.fetchPurchaseFromSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params; // get supplier ID from route params

    const purchases = await Purchase.find({ supplier: supplierId }) // filter by supplier
      .populate({
        path: "userId",
        select: "username",
      })
      .populate({
        path: "supplier",
        select: "name email code",
      })
      .populate({
        path: "purchaseItems.productId",
        select: "title purchasePrice",
      })
      .sort({ createdAt: -1 }); // latest first

    res.status(200).json(purchases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========================
// FETCH SUPPLIER PAYMENT SUMMARY
// ========================
exports.getSupplierPaymentSummary = async (req, res) => {
  try {
    const { supplierId } = req.params;

    // Fetch all purchase from the supplier
    const purchases = await Purchase.find({ supplier: supplierId });

    if (!purchases.length) {
      return res.status(404).json({
        success: false,
        message: "No purchase found from this supplier",
      });
    }

    let totalPaid = 0;
    let totalOutstanding = 0;

    purchases.forEach((purchase) => {
      // Total Paid: sum amountPaid for partial or fully paid sales
      if (
        purchase.paymentStatus === "paid" ||
        purchase.paymentStatus === "partial"
      ) {
        totalPaid += purchase.amountPaid;
      }

      // Total Outstanding: sum dueBalance
      totalOutstanding += purchase.dueBalance;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalPaid,
        totalOutstanding,
      },
    });
  } catch (error) {
    console.error("Error fetching supplier payment summary:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================
// FETCH SUPPLIER OUTSTANDING PURCHASES
// ========================
exports.getSupplierOutstandingPurchase = async (req, res) => {
  try {
    const { supplierId } = req.params;

    if (!supplierId) {
      return res.status(400).json({ message: "Supplier ID is required" });
    }

    // Fetch only outstanding purchases (dueBalance > 0)
    const outstandingPurchases = await Purchase.find({
      supplier: supplierId,
      dueBalance: { $gt: 0 }, // Only unpaid or partially paid
    })
      .populate("supplier", "name email phoneNumber code address")
      .populate("purchaseItems.productId", "title price"); // optional product info

    res.status(200).json({
      success: true,
      count: outstandingPurchases.length,
      outstandingPurchases,
    });
  } catch (error) {
    console.error("Error fetching outstanding purchases:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch outstanding purchases",
      error: error.message,
    });
  }
};

// Update Purchase
exports.purchaseUpdate = async (req, res) => {
  const purchaseId = req.params.purchaseId;

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
    const user = req.user; // comes from verifyToken
    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
      return res.status(400).json({ message: "Invalid purchase ID" });
    }

    // Get old purchase
    const oldPurchase = await Purchase.findById(purchaseId);
    if (!oldPurchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Rollback old stock
    for (const item of oldPurchase.purchaseItems) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;

      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            purchaseQuantity: -item.quantity,
            stockQuantity: -item.quantity,
          },
        },
        { new: true },
      );
    }

    // Clean new items
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

    const updateData = {
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
    };

    // ===========================
    // PAYMENT LOGIC (SAME AS SALE)
    // ===========================

    if (paymentStatus === "unpaid") {
      updateData.amountPaid = 0;
      updateData.dueBalance = purchaseAmount;

      await Payment.deleteMany({ paymentFor: oldPurchase.code });
    } else if (paymentStatus === "paid") {
      updateData.amountPaid = purchaseAmount;
      updateData.dueBalance = 0;

      const existingPayment = await Payment.findOne({
        paymentFor: oldPurchase.code,
      });

      if (existingPayment) {
        if (existingPayment.payableAmount !== purchaseAmount) {
          existingPayment.payableAmount = purchaseAmount;
          existingPayment.paymentDate = purchaseDate;
          existingPayment.paymentType = paymentType;
          await existingPayment.save();
        }
      } else {
        await Payment.create({
          paymentDate: purchaseDate,
          paymentFor: oldPurchase.code,
          invoiceNo: oldPurchase.code,
          dueBalance: 0,
          payableAmount: purchaseAmount,
          paymentType,
          note,
          userId,
        });
      }
    } else if (paymentStatus === "partial") {
      const calculatedDue = purchaseAmount - (amountPaid || 0);
      updateData.dueBalance = calculatedDue;
      updateData.amountPaid = amountPaid || 0;

      const existingPayment = await Payment.findOne({
        paymentFor: oldPurchase.code,
      });

      if (existingPayment) {
        if (existingPayment.payableAmount !== (amountPaid || 0)) {
          existingPayment.payableAmount = amountPaid || 0;
          existingPayment.dueBalance = calculatedDue;
          existingPayment.paymentDate = purchaseDate;
          existingPayment.paymentType = paymentType;
          await existingPayment.save();
        }
      } else {
        await Payment.create({
          paymentDate: purchaseDate,
          paymentFor: oldPurchase.code,
          invoiceNo: oldPurchase.code,
          dueBalance: calculatedDue,
          payableAmount: amountPaid || 0,
          paymentType,
          note,
          userId,
        });
      }
    }

    // Update purchase
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      purchaseId,
      updateData,
      { new: true },
    );

    // Apply new stock
    for (const item of cleanedItems) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;

      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            purchaseQuantity: item.quantity,
            stockQuantity: item.quantity,
          },
        },
        { new: true },
      );
    }

    // Activity log
    await logActivity({
      user,
      action: "UPDATE",
      module: "Purchase",
      documentId: updatedPurchase._id,
      description: `Updated a purchase "${updatedPurchase.code}"`,
      newData: {
        title: updatedPurchase.code,
        code: updatedPurchase.code,
        status: "",
      },
    });

    res.status(200).json({
      message: "Purchase updated successfully",
      updatedPurchase,
    });
  } catch (error) {
    console.error("❌ Purchase Update Error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// delete purchase
exports.deletePurchase = async (req, res) => {
  const { purchaseId } = req.params;
  const user = req.user; // comes from verifyToken
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const purchase = await Purchase.findById(purchaseId).session(session);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // 1️⃣ REMOVE wastageQuantity ONLY (no stock restore)
    const wastages = await Wastage.find({ purchaseId }).session(session);

    for (const waste of wastages) {
      await Product.findByIdAndUpdate(
        waste.productId,
        {
          $inc: {
            wasteQuantity: -waste.quantity, // ✅ ONLY THIS
            stockQuantity: +waste.quantity,
          },
        },
        { session },
      );
    }

    // 2️⃣ DELETE wastage records
    await Wastage.deleteMany({ purchaseId }, { session });

    // 3️⃣ DELETE purchase returns (NO reversal)
    await PurchaseReturn.deleteMany({ purchase: purchaseId }, { session });

    // 4️⃣ REVERSE original purchase quantities
    for (const item of purchase.purchaseItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            purchaseQuantity: -item.quantity,
            stockQuantity: -item.quantity,
          },
        },
        { session },
      );
    }

    // 5️⃣ DELETE purchase
    const purchaseDeleted = await Purchase.findByIdAndDelete(purchaseId, {
      session,
    });

    // Activity log
    await logActivity({
      user,
      action: "DELETE",
      module: "Purchase",
      documentId: purchaseDeleted._id,
      description: `Deleted a purchase "${purchaseDeleted.code}"`,
      newData: {
        title: purchaseDeleted.code,
        code: purchaseDeleted.code,
        status: "",
      },
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Purchase deleted (wastage stock NOT restored)",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Delete Purchase Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// BULK DELETE purchases
exports.bulkDeletePurchase = async (req, res) => {
  const { ids } = req.body; // array of purchase IDs
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No purchase IDs provided" });
    }

    const purchases = await Purchase.find({ _id: { $in: ids } }).session(
      session,
    );

    for (const purchase of purchases) {
      const purchaseId = purchase._id;

      // 🔹 Keep a snapshot for activity log
      const oldPurchaseData = purchase.toObject();
      const purchaseCode = purchase.code; // adjust field name if different

      // 1️⃣ Handle wastages: remove wastageQuantity only, restore stockQuantity
      const wastages = await Wastage.find({ purchaseId }).session(session);
      for (const waste of wastages) {
        await Product.findByIdAndUpdate(
          waste.productId,
          {
            $inc: {
              wasteQuantity: -waste.quantity,
              stockQuantity: +waste.quantity,
            },
          },
          { session },
        );
      }

      // 2️⃣ Delete wastage records
      await Wastage.deleteMany({ purchaseId }, { session });

      // 3️⃣ Delete purchase returns (NO reversal)
      await PurchaseReturn.deleteMany({ purchase: purchaseId }, { session });

      // 4️⃣ Reverse original purchase quantities
      for (const item of purchase.purchaseItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              purchaseQuantity: -item.quantity,
              stockQuantity: -item.quantity,
            },
          },
          { session },
        );
      }

      // 5️⃣ Delete purchase
      await Purchase.findByIdAndDelete(purchaseId, { session });

      // 6️⃣ Activity Log (outside DB mutations but still in flow)
      await logActivity({
        user: req.user,
        action: "DELETE",
        module: "Purchase",
        documentId: purchaseId,
        description: `Purchase (${purchaseCode}) deleted via bulk delete`,
        oldData: oldPurchaseData,
        newData: {
          title: purchaseCode,
          code: purchaseCode,
          status: "",
        },
      });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message:
        "Selected purchases deleted successfully (wastage stock restored, purchaseReturn not reversed)",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Bulk Delete Purchases Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Total of All Purchase Amounts
exports.getTotalPurchaseAmount = async (req, res) => {
  try {
    const result = await Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalPurchase: { $sum: "$purchaseAmount" },
        },
      },
    ]);

    const total = result[0]?.totalPurchase || 0;

    res.status(200).json({ totalPurchaseAmount: total });
  } catch (error) {
    console.error(
      "Error getting total Purchase amount:",
      error.message,
      error.stack,
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Total outstanding puchase:
exports.getTotalOutstandingPurchasePayment = async (req, res) => {
  try {
    const result = await Purchase.aggregate([
      {
        $match: {
          // remove if not filtering by user
          paymentStatus: { $in: ["unpaid", "partial"] },
        },
      },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: "$dueBalance" },
        },
      },
    ]);

    const totalOutstanding = result.length > 0 ? result[0].totalOutstanding : 0;

    res.status(200).json({
      success: true,
      totalOutstanding,
    });
  } catch (error) {
    console.error("Error fetching outstanding payments:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//fetch product purchase supppliers
exports.getProductSuppliers = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await Purchase.aggregate([
      // 1. Break purchaseItems array
      { $unwind: "$purchaseItems" },

      // 2. Match product
      {
        $match: {
          "purchaseItems.productId": new mongoose.Types.ObjectId(productId),
        },
      },

      // 3. Join customer
      {
        $lookup: {
          from: "suppliers",
          localField: "supplier",
          foreignField: "_id",
          as: "supplier",
        },
      },
      { $unwind: "$supplier" },

      // 4. Group by supplier + product
      {
        $group: {
          _id: {
            supplierId: "$supplier._id",
            productId: "$purchaseItems.productId",
          },

          supplierName: { $first: "$supplier.name" },
          productName: { $first: "$purchaseItems.title" },

          totalQuantity: { $sum: "$purchaseItems.quantity" },

          unitPrice: { $avg: "$purchaseItems.price" },

          totalAmount: { $sum: "$purchaseItems.amount" },

          lastPurchaseDate: { $max: "$purchaseDate" }, // ✅ ADDED
        },
      },

      // 5. Format output
      {
        $project: {
          _id: 0,
          supplier: "$supplierName",
          productName: 1,
          quantity: "$totalQuantity",
          unitPrice: { $round: ["$unitPrice", 2] },
          amount: "$totalAmount",
          lastPurchaseDate: 1, // ✅ ADDED
        },
      },

      // Optional: sort
      { $sort: { supplier: 1 } },
    ]);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching product suppliers",
    });
  }
};
