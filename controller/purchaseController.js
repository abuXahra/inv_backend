// const { default: mongoose } = require("mongoose");
// const Purchase = require("../models/Purchase");
// const Product = require("../models/Product");

// // register Purchase data
// exports.purchaseRegister = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const {
//       purchaseDate,
//       supplier,
//       purchaseStatus,
//       reference,
//       purchaseAmount,
//       paymentType,
//       paymentStatus,
//       amountPaid,
//       dueBalance,
//       note,
//       subTotal,
//       otherCharges,
//       discount,
//       discountValue,
//       shipping,
//       purchaseItems = [],
//       prefix,
//       userId,
//     } = req.body;

//     const lastPurchase = await Purchase.findOne({
//       code: { $regex: `^${prefix}` },
//     })
//       .sort({ code: -1 })
//       .exec();

//     let lastSerial = 0;
//     if (lastPurchase && lastPurchase.code) {
//       const match = lastPurchase.code.match(/\d+$/);
//       if (match) {
//         lastSerial = parseInt(match[0], 10);
//       }
//     }
//     const serial = (lastSerial + 1).toString().padStart(4, "0");
//     const code = `${prefix}${serial}`;

//     const cleanedItems = purchaseItems.map((item) => ({
//       productId: item.productId,
//       title: item.title,
//       quantity: Number(item.quantity),
//       price: Number(item.price),
//       tax: Number(item.tax),
//       taxAmount: Number(item.taxAmount),
//       unitCost: Number(item.unitCost),
//       amount: Number(item.amount),
//     }));

//     const newPurchase = new Purchase({
//       code,
//       purchaseDate,
//       supplier,
//       purchaseStatus,
//       reference,
//       purchaseAmount,
//       paymentType,
//       paymentStatus,
//       amountPaid,
//       dueBalance,
//       note,
//       subTotal,
//       otherCharges,
//       discount,
//       discountValue,
//       shipping,
//       userId,
//       purchaseItems: cleanedItems,
//     });

//     if (paymentStatus === "unpaid") {
//       newPurchase.amountPaid = 0;
//       newPurchase.dueBalance = newPurchase.purchaseAmount;
//     } else if (paymentStatus === "paid") {
//       newPurchase.amountPaid = newPurchase.purchaseAmount;
//       newPurchase.dueBalance = 0;
//     } else if (paymentStatus === "partial") {
//       if (!newPurchase.amountPaid) {
//         newPurchase.dueBalance =
//           newPurchase.purchaseAmount - newPurchase.amountPaid;
//       }
//     }

//     await newPurchase.save({ session });

//     for (const item of cleanedItems) {
//       if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;

//       await Product.findByIdAndUpdate(
//         item.productId,
//         {
//           $inc: {
//             purchaseQuantity: item.quantity,
//             stockQuantity: item.quantity, // ✅ Increment stock on purchase
//           },
//         },
//         { new: true, session }
//       );
//     }

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       message: "Purchase saved successful",
//       newPurchase,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("❌ Purchase Register Error:", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// // fetch Purchase data
// exports.fetchPurchase = async (req, res) => {
//   try {
//     const purchase = await Purchase.findById(req.params.purchaseId)
//       .populate({ path: "userId", select: "username" })
//       .populate({ path: "supplier", select: "name" });
//     if (!purchase) {
//       return res.status(400).json({ message: "Purchase not found" });
//     }
//     res.status(200).json(purchase);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

// // fetch all purchase
// exports.fetchAllPurchase = async (req, res) => {
//   try {
//     const purchase = await Purchase.find({})
//       .populate({ path: "userId", select: "username" })
//       .populate({ path: "supplier", select: "name" });
//     res.status(200).json(purchase);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

// // Update Purchase (with transaction)
// exports.purchaseUpdate = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const purchaseId = req.params.purchaseId;
//     const {
//       purchaseDate,
//       supplier,
//       purchaseStatus,
//       reference,
//       purchaseAmount,
//       paymentType,
//       paymentStatus,
//       amountPaid,
//       note,
//       subTotal,
//       otherCharges,
//       discount,
//       discountValue,
//       shipping,
//       purchaseItems = [],
//       userId,
//     } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
//       throw new Error("Invalid purchase ID");
//     }

//     const oldPurchase = await Purchase.findById(purchaseId).session(session);
//     if (!oldPurchase) {
//       throw new Error("Purchase not found");
//     }

//     // 2️⃣ Rollback previous purchase quantities and stock
//     for (const item of oldPurchase.purchaseItems) {
//       if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;
//       await Product.findByIdAndUpdate(
//         item.productId,
//         {
//           $inc: {
//             purchaseQuantity: -item.quantity,
//             stockQuantity: -item.quantity, // ✅ Rollback stock
//           },
//         },
//         { session }
//       );
//     }

//     const cleanedItems = purchaseItems.map((item) => ({
//       productId: item.productId,
//       title: item.title,
//       quantity: Number(item.quantity),
//       price: Number(item.price),
//       tax: Number(item.tax),
//       taxAmount: Number(item.taxAmount),
//       unitCost: Number(item.unitCost),
//       amount: Number(item.amount),
//     }));

//     const updateData = {
//       purchaseDate,
//       supplier,
//       purchaseStatus,
//       reference,
//       purchaseAmount,
//       paymentType,
//       paymentStatus,
//       amountPaid,
//       note,
//       subTotal,
//       otherCharges,
//       discount,
//       discountValue,
//       shipping,
//       purchaseItems: cleanedItems,
//       userId,
//     };

//     if (paymentStatus === "unpaid") {
//       updateData.amountPaid = 0;
//       updateData.dueBalance = purchaseAmount;
//     } else if (paymentStatus === "paid") {
//       updateData.amountPaid = purchaseAmount;
//       updateData.dueBalance = 0;
//     } else if (paymentStatus === "partial") {
//       if (!amountPaid || amountPaid <= 0) {
//         updateData.amountPaid = 0;
//         updateData.dueBalance = purchaseAmount;
//       } else {
//         updateData.dueBalance = purchaseAmount - amountPaid;
//       }
//     }

//     const updatedPurchase = await Purchase.findByIdAndUpdate(
//       purchaseId,
//       updateData,
//       { new: true, session }
//     );

//     // 7️⃣ Add the new quantities and stock
//     for (const item of cleanedItems) {
//       if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;
//       await Product.findByIdAndUpdate(
//         item.productId,
//         {
//           $inc: {
//             purchaseQuantity: item.quantity,
//             stockQuantity: item.quantity, // ✅ Add new stock
//           },
//         },
//         { session }
//       );
//     }

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       message: "Purchase updated successfully",
//       updatedPurchase,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("❌ Purchase Update Error:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// // Delete purchase (with transaction)
// exports.deletePurchase = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const purchaseId = req.params.purchaseId;
//     if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
//       throw new Error("Invalid purchase ID");
//     }

//     const purchase = await Purchase.findById(purchaseId).session(session);
//     if (!purchase) {
//       throw new Error("Purchase not found");
//     }

//     // 2. Decrement the `purchaseQuantity` and `stockQuantity` for each product
//     for (const item of purchase.purchaseItems) {
//       if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;
//       await Product.findByIdAndUpdate(
//         item.productId,
//         {
//           $inc: {
//             purchaseQuantity: -item.quantity,
//             stockQuantity: -item.quantity, // ✅ Decrement stock on delete
//           },
//         },
//         { session }
//       );
//     }

//     await Purchase.findByIdAndDelete(purchaseId).session(session);
//     await session.commitTransaction();
//     session.endSession();

//     return res.status(200).json({ message: "Purchase deleted successfully" });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("❌ Purchase Delete Error:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // Bulk Delete Purchases (with transaction and bulkWrite optimization)
// exports.bulkDeletePurchase = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { ids } = req.body;

//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//       throw new Error("No Purchase IDs provided.");
//     }

//     const purchases = await Purchase.find({ _id: { $in: ids } }).session(
//       session
//     );
//     if (purchases.length === 0) {
//       throw new Error("No matching purchases found.");
//     }

//     const bulkUpdateOperations = [];
//     for (const purchase of purchases) {
//       for (const item of purchase.purchaseItems) {
//         if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;
//         bulkUpdateOperations.push({
//           updateOne: {
//             filter: { _id: item.productId },
//             update: {
//               $inc: {
//                 purchaseQuantity: -item.quantity,
//                 stockQuantity: -item.quantity, // ✅ Decrement stock in bulk
//               },
//             },
//           },
//         });
//       }
//     }

//     if (bulkUpdateOperations.length > 0) {
//       await Product.bulkWrite(bulkUpdateOperations, { session });
//     }

//     const result = await Purchase.deleteMany({ _id: { $in: ids } }).session(
//       session
//     );

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       success: true,
//       message: `${result.deletedCount} purchases deleted and product quantities rolled back.`,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("❌ Bulk delete purchase error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//       error: error.message,
//     });
//   }
// };

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

    // Enforce dueBalance & amountPaid rules
    if (paymentStatus === "unpaid") {
      newPurchase.amountPaid = 0;
      newPurchase.dueBalance = newPurchase.purchaseAmount;
    } else if (paymentStatus === "paid") {
      newPurchase.amountPaid = newPurchase.purchaseAmount;
      newPurchase.dueBalance = 0;
    } else if (paymentStatus === "partial") {
      if (!newPurchase.amountPaid) {
        newPurchase.dueBalance =
          newPurchase.purchaseAmount - newPurchase.amountPaid;
      }
    }

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
        {
          $inc: {
            purchaseQuantity: item.quantity,
            stockQuantity: item.quantity,
          },
        },
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
        {
          $inc: {
            purchaseQuantity: -item.quantity,
            stockQuantity: -item.quantity,
          },
        }, // rollback
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

    // 5️⃣ Enforce dueBalance & amountPaid rules (same as registerSale)
    if (paymentStatus === "unpaid") {
      updateData.amountPaid = 0;
      updateData.dueBalance = purchaseAmount;
    } else if (paymentStatus === "paid") {
      updateData.amountPaid = purchaseAmount;
      updateData.dueBalance = 0;
    } else if (paymentStatus === "partial") {
      if (!amountPaid || amountPaid <= 0) {
        updateData.amountPaid = 0;
        updateData.dueBalance = purchaseAmount;
      } else {
        updateData.dueBalance = purchaseAmount - amountPaid;
      }
    }

    // 6️⃣ Update the sale
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      purchaseId,
      updateData,
      {
        new: true,
      }
    );

    // 5️⃣ Add the new quantities
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

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Rollback product quantities
    for (const item of purchase.purchaseItems) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;

      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            purchaseQuantity: -item.quantity,
            stockQuantity: -item.quantity,
          },
        },
        { new: true }
      );
    }

    // Now delete the purchase
    await Purchase.findByIdAndDelete(purchaseId);

    res.status(200).json({
      success: true,
      message: "purchase deleted and product quantities rolled back.",
    });
  } catch (err) {
    console.error("Delete purchase Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.bulkDeletePurchase = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Purchase IDs provided.",
      });
    }

    // Fetch all Purchase to rollback product quantities
    const purchases = await Purchase.find({ _id: { $in: ids } });

    if (purchases.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching purchases found.",
      });
    }

    for (const purchase of purchases) {
      for (const item of purchase.purchaseItems) {
        if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;

        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              purchaseQuantity: -item.quantity,
              stockQuantity: -item.quantity,
            },
          },
          { new: true }
        );
      }
    }

    // Now delete all purchases in one operation
    const result = await Purchase.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} purchases deleted and product quantities rolled back.`,
    });
  } catch (error) {
    console.error("Bulk delete purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
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
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
