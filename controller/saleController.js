// const mongoose = require("mongoose");
// const Sale = require("../models/Sale");
// const Product = require("../models/Product");

// // Helper: Generate Code
// const generateSaleCode = async (prefix) => {
//   const lastSale = await Sale.findOne({
//     code: { $regex: `^${prefix}` },
//   })
//     .sort({ code: -1 })
//     .exec();

//   let lastSerial = 0;
//   if (lastSale && lastSale.code) {
//     const match = lastSale.code.match(/\d+$/);
//     if (match) lastSerial = parseInt(match, 10);
//   }
//   const serial = (lastSerial + 1).toString().padStart(4, "0");
//   return `${prefix}${serial}`;
// };

// // 📌 Register Sale
// exports.saleRegister = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const {
//       saleDate,
//       customer,
//       saleStatus,
//       reference,
//       paymentType,
//       amountPaid = 0,
//       note,
//       otherCharges = 0,
//       discount = 0,
//       discountValue = 0,
//       shipping = 0,
//       saleItems = [],
//       prefix,
//       userId,
//     } = req.body;

//     const code = await generateSaleCode(prefix);

//     const processedItems = [];
//     let calculatedSubTotal = 0;

//     for (const item of saleItems) {
//       const product = await Product.findById(item.productId).session(session);
//       if (!product) {
//         throw new Error(`Product with ID ${item.productId} not found.`);
//       }
//       if (item.quantity <= 0) {
//         throw new Error(`Quantity for item ${product.title} must be positive.`);
//       }

//       // Check for sufficient stock using the new stockQuantity field
//       if (product.stockQuantity < item.quantity) {
//         throw new Error(
//           `Insufficient stock for product ${product.title}. Available: ${product.stockQuantity}, Requested: ${item.quantity}.`
//         );
//       }

//       const itemPrice = product.salePrice;
//       const itemTaxAmount = item.quantity * itemPrice * (product.tax / 100);
//       const itemAmount = item.quantity * itemPrice + itemTaxAmount;
//       calculatedSubTotal += itemAmount;

//       processedItems.push({
//         productId: item.productId,
//         quantity: item.quantity,
//         price: itemPrice,
//         tax: product.tax,
//         taxAmount: itemTaxAmount,
//         unitCost: product.unitCost,
//         amount: itemAmount,
//       });
//     }

//     let finalSaleAmount =
//       calculatedSubTotal + otherCharges + shipping - discountValue;

//     const newSale = new Sale({
//       code,
//       saleDate,
//       customer,
//       saleStatus,
//       reference,
//       paymentType,
//       amountPaid: amountPaid,
//       saleAmount: finalSaleAmount,
//       note,
//       subTotal: calculatedSubTotal,
//       otherCharges,
//       discount,
//       discountValue,
//       shipping,
//       userId,
//       saleItems: processedItems,
//     });

//     await newSale.save({ session });

//     // Update product quantities and the new stockQuantity field
//     for (const item of processedItems) {
//       await Product.findByIdAndUpdate(
//         item.productId,
//         {
//           $inc: {
//             saleQuantity: item.quantity,
//             stockQuantity: -item.quantity,
//           },
//         },
//         { session, new: true }
//       );
//     }

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       message: "Sale saved successfully",
//       newSale,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("❌ Sale Register Error:", error);
//     res.status(500).json({
//       message: error.message || "Internal server error",
//       error: error.message,
//     });
//   }
// };

// // 📌 Fetch Sale
// exports.fetchSale = async (req, res) => {
//   try {
//     const sale = await Sale.findById(req.params.saleId)
//       .populate("userId", "username")
//       .populate("customer", "name");

//     if (!sale) {
//       return res.status(404).json({ message: "Sale not found" });
//     }
//     res.status(200).json(sale);
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: err.message });
//   }
// };

// // 📌 Fetch All Sales
// exports.fetchAllSale = async (req, res) => {
//   try {
//     const sales = await Sale.find({})
//       .populate("userId", "username")
//       .populate("customer", "name");

//     res.status(200).json(sales);
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: err.message });
//   }
// };

// // 📌 Update Sale
// exports.saleUpdate = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { saleId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(saleId)) {
//       throw new Error("Invalid sale ID");
//     }

//     const oldSale = await Sale.findById(saleId).session(session);
//     if (!oldSale) {
//       throw new Error("Sale not found");
//     }

//     // Rollback quantities and stock
//     for (const item of oldSale.saleItems) {
//       if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;
//       await Product.findByIdAndUpdate(
//         item.productId,
//         {
//           $inc: {
//             saleQuantity: -item.quantity,
//             stockQuantity: item.quantity,
//           },
//         },
//         { session, new: true }
//       );
//     }

//     const { saleItems = [], amountPaid, ...updateFields } = req.body;

//     const processedItems = [];
//     let calculatedSubTotal = 0;

//     for (const item of saleItems) {
//       const product = await Product.findById(item.productId).session(session);
//       if (!product) {
//         throw new Error(`Product with ID ${item.productId} not found.`);
//       }
//       if (item.quantity <= 0) {
//         throw new Error(`Quantity for item ${product.title} must be positive.`);
//       }
//       // Check stock after rolling back old quantities
//       if (product.stockQuantity < item.quantity) {
//         throw new Error(`Insufficient stock for product ${product.title}.`);
//       }

//       const itemPrice = product.salePrice;
//       const itemTaxAmount = item.quantity * itemPrice * (product.tax / 100);
//       const itemAmount = item.quantity * itemPrice + itemTaxAmount;
//       calculatedSubTotal += itemAmount;

//       processedItems.push({
//         productId: item.productId,
//         quantity: item.quantity,
//         price: itemPrice,
//         tax: product.tax,
//         taxAmount: itemTaxAmount,
//         unitCost: product.unitCost,
//         amount: itemAmount,
//       });
//     }

//     const saleAmount =
//       calculatedSubTotal +
//       (updateFields.otherCharges || 0) +
//       (updateFields.shipping || 0) -
//       (updateFields.discountValue || 0);

//     const updateData = {
//       ...updateFields,
//       subTotal: calculatedSubTotal,
//       saleItems: processedItems,
//       amountPaid,
//       saleAmount,
//     };

//     const updatedSale = await Sale.findByIdAndUpdate(saleId, updateData, {
//       new: true,
//       runValidators: true,
//       session,
//     });

//     // Update product quantities and stock for the new items
//     for (const item of processedItems) {
//       await Product.findByIdAndUpdate(
//         item.productId,
//         {
//           $inc: {
//             saleQuantity: item.quantity,
//             stockQuantity: -item.quantity,
//           },
//         },
//         { session, new: true }
//       );
//     }

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       message: "Sale updated successfully",
//       updatedSale,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("❌ Sale Update Error:", error);
//     res.status(500).json({
//       message: error.message || "Internal server error",
//       error: error.message,
//     });
//   }
// };

// // 📌 Delete Sale
// exports.deleteSale = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { saleId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(saleId)) {
//       throw new Error("Invalid sale ID");
//     }

//     const sale = await Sale.findById(saleId).session(session);
//     if (!sale) {
//       throw new Error("Sale not found");
//     }

//     // Rollback quantities and stock
//     for (const item of sale.saleItems) {
//       await Product.findByIdAndUpdate(
//         item.productId,
//         {
//           $inc: {
//             saleQuantity: -item.quantity,
//             stockQuantity: item.quantity,
//           },
//         },
//         { session, new: true }
//       );
//     }

//     await sale.deleteOne({ session });

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       success: true,
//       message: "Sale deleted and product quantities rolled back.",
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("❌ Sale Deletion Error:", error);
//     res.status(500).json({
//       message: error.message || "Internal server error",
//       error: error.message,
//     });
//   }
// };

// // 📌 Bulk Delete Sales (with transaction and bulkWrite optimization)
// exports.bulkDeleteSale = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { ids } = req.body;

//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//       throw new Error("No Sale IDs provided.");
//     }

//     // 1. Fetch all sales to rollback product quantities
//     const sales = await Sale.find({ _id: { $in: ids } }).session(session);
//     if (sales.length === 0) {
//       throw new Error("No matching sales found.");
//     }

//     // 2. Prepare bulk update operations for product quantities and stock
//     const bulkUpdateOperations = [];
//     for (const sale of sales) {
//       for (const item of sale.saleItems) {
//         if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;

//         bulkUpdateOperations.push({
//           updateOne: {
//             filter: { _id: item.productId },
//             update: {
//               $inc: {
//                 saleQuantity: -item.quantity,
//                 stockQuantity: item.quantity,
//               },
//             },
//           },
//         });
//       }
//     }

//     if (bulkUpdateOperations.length > 0) {
//       await Product.bulkWrite(bulkUpdateOperations, { session });
//     }

//     // 3. Delete all sales in one operation
//     const result = await Sale.deleteMany({ _id: { $in: ids } }).session(
//       session
//     );

//     // 4. Commit the transaction
//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       success: true,
//       message: `${result.deletedCount} sales deleted and product quantities rolled back.`,
//     });
//   } catch (error) {
//     // 5. Rollback the transaction on error
//     await session.abortTransaction();
//     session.endSession();
//     console.error("❌ Bulk delete sale error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//       error: error.message,
//     });
//   }
// };

// // ===============================
// // Get all unpaid or partial sales
// // ===============================
// exports.getPayableSales = async (req, res) => {
//   try {
//     const payableSales = await Sale.find({
//       paymentStatus: { $in: ["unpaid", "partial"] },
//     })
//       .populate({
//         path: "customer",
//         select: "name", // populate customer name
//       })
//       .select("code customer saleAmount paymentStatus"); // select customer object, not just name

//     res.status(200).json(payableSales);
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Error fetching payable sales", error: err.message });
//   }
// };

const { default: mongoose } = require("mongoose");
const Sale = require("../models/Sale");
const Product = require("../models/Product");

// register sale data
exports.saleRegister = async (req, res) => {
  try {
    const {
      saleDate,
      customer,
      saleStatus,
      reference,
      saleAmount,
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
      saleItems = [],
      prefix,
      userId,
    } = req.body;

    // Find the last sale with the same prefix
    const lastSale = await Sale.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;

    if (lastSale && lastSale.code) {
      const match = lastSale.code.match(/\d+$/); // Extract the numeric part from the code
      if (match) {
        lastSerial = parseInt(match[0], 10);
      }
    }
    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;

    // Sale Item
    const cleanedItems = saleItems.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: Number(item.quantity),
      price: Number(item.price),
      tax: Number(item.tax),
      taxAmount: Number(item.taxAmount),
      unitCost: Number(item.unitCost),
      amount: Number(item.amount),
    }));
    console.log("🧾 Received Sale Items:", saleItems);
    console.log("🧾 Processed Items:", cleanedItems);
    console.log("🧾 Creating sale with data:");

    // Create sale instance
    const newSale = new Sale({
      code,
      saleDate,
      customer,
      saleStatus,
      reference,
      saleAmount,
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
      saleItems: cleanedItems,
    });

    // Enforce dueBalance & amountPaid rules
    if (paymentStatus === "unpaid") {
      newSale.amountPaid = 0;
      newSale.dueBalance = newSale.saleAmount;
    } else if (paymentStatus === "paid") {
      newSale.amountPaid = newSale.saleAmount;
      newSale.dueBalance = 0;
    } else if (paymentStatus === "partial") {
      if (!amountPaid || amountPaid <= 0) {
        newSale.amountPaid = 0;
        newSale.dueBalance = newSale.saleAmount;
      } else {
        newSale.dueBalance = newSale.saleAmount - newSale.amountPaid;
      }
      // if (!newSale.amountPaid) {
      //   newSale.dueBalance = newSale.saleAmount - newSale.amountPaid;
      // }
    }

    await newSale.save();

    // loop through the sale Items and increase the product sale quantity accordingly
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
            saleQuantity: item.quantity,
            stockQuantity: -item.quantity,
          },
        },
        { new: true }
      );
    }

    res.status(200).json({
      message: "Sale saved successful",
      newSale,
    });
  } catch (error) {
    console.error("❌ Sale Register Error:", error); // Full error object
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// fetch sale data
exports.fetchSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.saleId)
      .populate({
        path: "userId",
        select: "username",
      })
      .populate({
        path: "customer",
        select: "name",
      });
    if (!sale) {
      return res.status(400).json({ message: "sale not found" });
    }
    res.status(200).json(sale);
  } catch (err) {
    res.status(500).json(err);
  }
};

// fetch all sale
exports.fetchAllSale = async (req, res) => {
  try {
    const sale = await Sale.find({})
      .populate({
        path: "userId",
        select: "username",
      })
      .populate({
        path: "customer",
        select: "name",
      });
    res.status(200).json(sale);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Update Sale
exports.saleUpdate = async (req, res) => {
  const saleId = req.params.saleId;
  try {
    const {
      saleDate,
      customer,
      saleStatus,
      reference,
      saleAmount,
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
      saleItems = [],
      userId,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      return res.status(400).json({ message: "Invalid sale ID" });
    }

    // 1️⃣ Get the old sale so we can rollback stock
    const oldSale = await Sale.findById(saleId);
    if (!oldSale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    // 2️⃣ Rollback previous sale quantities
    for (const item of oldSale.saleItems) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            saleQuantity: -item.quantity,
            stockQuantity: item.quantity,
          },
        }, // rollback
        { new: true }
      );
    }

    // 3️⃣ Clean and sanitize new items
    const cleanedItems = saleItems.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: Number(item.quantity),
      price: Number(item.price),
      tax: Number(item.tax),
      taxAmount: Number(item.taxAmount),
      unitCost: Number(item.unitCost),
      amount: Number(item.amount),
    }));

    // 4️⃣ Prepare updated sale object
    const updateData = {
      saleDate,
      customer,
      saleStatus,
      reference,
      saleAmount,
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
      saleItems: cleanedItems,
      userId,
    };

    // 5️⃣ Enforce dueBalance & amountPaid rules (same as registerSale)
    if (paymentStatus === "unpaid") {
      updateData.amountPaid = 0;
      updateData.dueBalance = saleAmount;
    } else if (paymentStatus === "paid") {
      updateData.amountPaid = saleAmount;
      updateData.dueBalance = 0;
    } else if (paymentStatus === "partial") {
      if (!amountPaid || amountPaid <= 0) {
        updateData.amountPaid = 0;
        updateData.dueBalance = saleAmount;
      } else {
        updateData.dueBalance = saleAmount - amountPaid;
      }
    }

    // 6️⃣ Update the sale
    const updatedSale = await Sale.findByIdAndUpdate(saleId, updateData, {
      new: true,
    });

    // 7️⃣ Add the new sale quantities
    for (const item of cleanedItems) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;

      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            saleQuantity: item.quantity,
            stockQuantity: -item.quantity,
          },
        },
        { new: true }
      );
    }

    res.status(200).json({
      message: "Sale updated successfully",
      updatedSale,
    });
  } catch (error) {
    console.error("❌ Sale Update Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// spark go21

exports.deleteSale = async (req, res) => {
  try {
    const saleId = req.params.saleId;

    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    // Rollback product quantities
    for (const item of sale.saleItems) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;

      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            saleQuantity: -item.quantity,
            stockQuantity: item.quantity,
          },
        },
        { new: true }
      );
    }

    // Now delete the sale
    await Sale.findByIdAndDelete(saleId);

    res.status(200).json({
      success: true,
      message: "Sale deleted and product quantities rolled back.",
    });
  } catch (err) {
    console.error("Delete Sale Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.bulkDeleteSale = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Sale IDs provided.",
      });
    }

    // Fetch all sales to rollback product quantities
    const sales = await Sale.find({ _id: { $in: ids } });

    if (sales.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching sales found.",
      });
    }

    for (const sale of sales) {
      for (const item of sale.saleItems) {
        if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;

        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              saleQuantity: -item.quantity,
              stockQuantity: item.quantity,
            },
          },
          { new: true }
        );
      }
    }

    // Now delete all sales in one operation
    const result = await Sale.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} sales deleted and product quantities rolled back.`,
    });
  } catch (error) {
    console.error("Bulk delete sale error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ===============================
// Get all unpaid or partial sales
// ===============================
exports.getPayableSales = async (req, res) => {
  try {
    const payableSales = await Sale.find({
      paymentStatus: { $in: ["unpaid", "partial"] },
    }).select("code customerName saleAmount paymentStatus");

    res.status(200).json(payableSales);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching payable sales", error: err.message });
  }
};
