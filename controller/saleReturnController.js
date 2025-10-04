// const mongoose = require("mongoose");
// const SalesReturn = require("../models/SaleReturn");
// const Sale = require("../models/Sale");
// const Product = require("../models/Product");

// // Helper: Generate Code
// const generateReturnCode = async (prefix) => {
//   const lastReturn = await SalesReturn.findOne({
//     code: { $regex: `^${prefix}` },
//   })
//     .sort({ code: -1 })
//     .exec();

//   let lastSerial = 0;
//   if (lastReturn && lastReturn.code) {
//     const match = lastReturn.code.match(/\d+$/);
//     if (match) lastSerial = parseInt(match, 10);
//   }
//   const serial = (lastSerial + 1).toString().padStart(4, "0");
//   return `${prefix}${serial}`;
// };

// // 📌 Register Sales Return
// exports.salesReturnRegister = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const {
//       returnDate,
//       saleId,
//       customer,
//       paymentType,
//       amountPaid,
//       reason,
//       otherCharges,
//       discount,
//       discountValue,
//       shipping,
//       returnItems = [],
//       prefix,
//       userId,
//     } = req.body;

//     const sale = await Sale.findById(saleId).session(session);
//     if (!sale) {
//       throw new Error("Sale not found");
//     }

//     const processedReturnItems = [];
//     let calculatedSubTotal = 0;

//     for (const item of returnItems) {
//       const soldItem = sale.saleItems.find(
//         (si) => si.productId.toString() === item.productId
//       );

//       if (!soldItem) {
//         throw new Error(
//           `Product with ID ${item.productId} was not sold in this sale`
//         );
//       }
//       if (item.quantity <= 0 || item.quantity > soldItem.quantity) {
//         throw new Error(`Invalid return quantity for item ${soldItem.title}`);
//       }

//       const itemAmount = item.quantity * soldItem.price;
//       calculatedSubTotal += itemAmount;

//       processedReturnItems.push({
//         productId: item.productId,
//         quantity: item.quantity,
//         amount: itemAmount,
//       });
//     }

//     const code = await generateReturnCode(prefix);
//     const finalOtherCharges = otherCharges || 0;
//     const finalDiscountValue = discountValue || 0;
//     const finalShipping = shipping || 0;
//     const finalReturnAmount =
//       calculatedSubTotal +
//       finalOtherCharges -
//       finalDiscountValue +
//       finalShipping;
//     const finalAmountPaid = amountPaid || 0;

//     const newReturn = new SalesReturn({
//       code,
//       returnDate,
//       sale: saleId,
//       customer,
//       returnAmount: finalReturnAmount,
//       paymentType,
//       amountPaid: finalAmountPaid,
//       reason,
//       subTotal: calculatedSubTotal,
//       otherCharges: finalOtherCharges,
//       discount: discount || 0,
//       discountValue: finalDiscountValue,
//       shipping: finalShipping,
//       returnItems: processedReturnItems,
//       userId,
//     });

//     await newReturn.save({ session });

//     // Update product quantities and stock
//     for (const item of processedReturnItems) {
//       await Product.findByIdAndUpdate(
//         item.productId,
//         {
//           $inc: {
//             saleReturnQuantity: +item.quantity,
//             saleQuantity: -item.quantity,
//             stockQuantity: +item.quantity,

//             // saleReturnQuantity: -item.quantity,
//             // saleQuantity: item.quantity,
//             // stockQuantity: -item.quantity,
//           },
//         },
//         { new: true, session }
//       );
//     }

//     await session.commitTransaction();
//     session.endSession();

//     res
//       .status(200)
//       .json({ message: "Sales return created", return: newReturn });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("❌ Sales Return Register Error:", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// // 📌 Fetch Single Sales Return
// exports.fetchSalesReturn = async (req, res) => {
//   try {
//     const salesReturn = await SalesReturn.findById(req.params.returnId)
//       .populate("sale", "code saleAmount")
//       .populate("customer", "name")
//       .populate("userId", "username")
//       .lean();

//     if (!salesReturn)
//       return res.status(404).json({ message: "Sales return not found" });

//     res.status(200).json(salesReturn);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// // 📌 Fetch All Sales Returns
// exports.fetchAllSalesReturns = async (req, res) => {
//   try {
//     const returns = await SalesReturn.find({})
//       .populate("sale", "code saleAmount")
//       .populate("customer", "name")
//       .populate("userId", "username")
//       .lean();

//     res.status(200).json(returns);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// // 📌 Update Sales Return
// exports.updateSalesReturn = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { returnId } = req.params;
//     const {
//       returnDate,
//       saleId,
//       customer,
//       reason,
//       paymentType,
//       amountPaid,
//       otherCharges,
//       discount,
//       discountValue,
//       shipping,
//       returnItems = [],
//       userId,
//     } = req.body;

//     // 1. Find and validate the sales return
//     const salesReturn = await SalesReturn.findById(returnId).session(session);
//     if (!salesReturn) {
//       throw new Error("Sales return not found");
//     }

//     // 2. Rollback product quantities and stock for the old items
//     for (const oldItem of salesReturn.returnItems) {
//       if (!mongoose.Types.ObjectId.isValid(oldItem.productId)) continue;
//       await Product.findByIdAndUpdate(
//         oldItem.productId,
//         {
//           $inc: {
//             saleReturnQuantity: -oldItem.quantity,
//             saleQuantity: oldItem.quantity,
//             stockQuantity: -oldItem.quantity,
//           },
//         },
//         { new: true, session }
//       );
//     }

//     // 3. Process new return items and calculate new financial figures
//     const processedReturnItems = [];
//     let calculatedSubTotal = 0;

//     const sale = await Sale.findById(saleId || salesReturn.sale).session(
//       session
//     );
//     if (!sale) {
//       throw new Error("Related sale not found");
//     }

//     for (const item of returnItems) {
//       const soldItem = sale.saleItems.find(
//         (si) => si.productId.toString() === item.productId
//       );

//       if (!soldItem) {
//         throw new Error(`Product with ID ${item.productId} not found in sale`);
//       }

//       if (item.quantity <= 0 || item.quantity > soldItem.quantity) {
//         throw new Error(`Invalid return quantity for item ${soldItem.title}`);
//       }

//       const itemAmount = item.quantity * soldItem.price;
//       calculatedSubTotal += itemAmount;

//       processedReturnItems.push({
//         productId: item.productId,
//         quantity: item.quantity,
//         amount: itemAmount,
//       });
//     }

//     const finalOtherCharges = otherCharges ?? salesReturn.otherCharges;
//     const finalDiscountValue = discountValue ?? salesReturn.discountValue;
//     const finalShipping = shipping ?? salesReturn.shipping;
//     const finalReturnAmount =
//       calculatedSubTotal +
//       finalOtherCharges -
//       finalDiscountValue +
//       finalShipping;
//     const finalAmountPaid = amountPaid ?? salesReturn.amountPaid;

//     // 4. Update the sales return document
//     const updatedSalesReturn = await SalesReturn.findByIdAndUpdate(
//       returnId,
//       {
//         returnDate: returnDate ?? salesReturn.returnDate,
//         sale: saleId ?? salesReturn.sale,
//         customer: customer ?? salesReturn.customer,
//         returnAmount: finalReturnAmount,
//         reason: reason ?? salesReturn.reason,
//         paymentType: paymentType ?? salesReturn.paymentType,
//         amountPaid: finalAmountPaid,
//         subTotal: calculatedSubTotal,
//         otherCharges: finalOtherCharges,
//         discount: discount ?? salesReturn.discount,
//         discountValue: finalDiscountValue,
//         shipping: finalShipping,
//         returnItems: processedReturnItems,
//         userId: userId ?? salesReturn.userId,
//       },
//       { new: true, runValidators: true, session }
//     );

//     // 5. Update product quantities and stock for the new items
//     for (const item of processedReturnItems) {
//       await Product.findByIdAndUpdate(
//         item.productId,
//         {
//           $inc: {
//             saleReturnQuantity: item.quantity,
//             saleQuantity: -item.quantity,
//             stockQuantity: item.quantity,
//           },
//         },
//         { new: true, session }
//       );
//     }

//     // 6. Commit the transaction
//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       message: "Sales return updated successfully",
//       return: updatedSalesReturn,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("❌ Sales Return Update Error:", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// // 📌 Delete Sales Return
// exports.deleteSalesReturn = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { returnId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(returnId)) {
//       throw new Error("Invalid sales return ID");
//     }

//     const salesReturn = await SalesReturn.findById(returnId).session(session);
//     if (!salesReturn) {
//       throw new Error("Sales return not found");
//     }

//     // Rollback quantities and stock
//     for (const item of salesReturn.returnItems) {
//       await Product.findByIdAndUpdate(
//         item.productId,
//         {
//           $inc: {
//             saleReturnQuantity: -item.quantity,
//             saleQuantity: item.quantity,
//             stockQuantity: -item.quantity,
//           },
//         },
//         { session }
//       );
//     }

//     await SalesReturn.findByIdAndDelete(returnId).session(session);

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       message: "Sales return deleted and product quantities rolled back.",
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("❌ Sales Return Deletion Error:", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// // 📌 Bulk Delete Sales Returns
// exports.bulkDeleteSalesReturn = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { ids } = req.body;

//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//       throw new Error("No sales return IDs provided.");
//     }

//     const returns = await SalesReturn.find({ _id: { $in: ids } }).session(
//       session
//     );
//     if (returns.length === 0) {
//       throw new Error("No matching sales returns found.");
//     }

//     // Prepare bulk update operations for product quantities and stock
//     const bulkUpdateOperations = [];
//     for (const salesReturn of returns) {
//       for (const item of salesReturn.returnItems) {
//         if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;

//         bulkUpdateOperations.push({
//           updateOne: {
//             filter: { _id: item.productId },
//             update: {
//               $inc: {
//                 saleReturnQuantity: -item.quantity,
//                 saleQuantity: item.quantity,
//                 stockQuantity: -item.quantity,
//               },
//             },
//           },
//         });
//       }
//     }

//     if (bulkUpdateOperations.length > 0) {
//       await Product.bulkWrite(bulkUpdateOperations, { session });
//     }

//     const result = await SalesReturn.deleteMany({ _id: { $in: ids } }).session(
//       session
//     );

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       success: true,
//       message: `${result.deletedCount} sales returns deleted and product quantities rolled back.`,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("❌ Bulk Delete Sales Return Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//       error: error.message,
//     });
//   }
// };

const mongoose = require("mongoose");
const SalesReturn = require("../models/SaleReturn");
const Sale = require("../models/Sale");
const Product = require("../models/Product");

// Helper: Generate Code
const generateReturnCode = async (prefix) => {
  const lastReturn = await SalesReturn.findOne({
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

// 📌 Register Sales Return
exports.salesReturnRegister = async (req, res) => {
  try {
    const {
      returnDate,
      saleId,
      customer,
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

    // 1️⃣ Find original sale
    const sale = await Sale.findById(saleId);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    // 2️⃣ Validate return items
    for (const item of returnItems) {
      const soldItem = sale.saleItems.find(
        (si) => si.productId.toString() === item.productId
      );

      if (!soldItem) {
        return res.status(400).json({
          message: `Product ${item.title} was not sold in this sale`,
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
    const newReturn = new SalesReturn({
      code,
      returnDate,
      sale: saleId,
      customer,
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
            saleReturnQuantity: item.quantity,
            saleQuantity: -item.quantity,
            stockQuantity: item.quantity,
          }, // reduce sold
        },
        { new: true }
      );
    }

    res
      .status(200)
      .json({ message: "Sales return created", return: newReturn });
  } catch (error) {
    console.error("❌ Sales Return Register Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Fetch Single Sales Return
exports.fetchSalesReturn = async (req, res) => {
  try {
    const salesReturn = await SalesReturn.findById(req.params.returnId)
      .populate("sale", "code saleAmount")
      .populate("customer", "name")
      .populate("userId", "username");

    if (!salesReturn)
      return res.status(404).json({ message: "Sales return not found" });

    res.status(200).json(salesReturn);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Fetch All Sales Returns
exports.fetchAllSalesReturns = async (req, res) => {
  try {
    const returns = await SalesReturn.find({})
      .populate("sale", "code saleAmount")
      .populate("customer", "name")
      .populate("userId", "username");

    res.status(200).json(returns);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Update Sales Return
// 📌 Update Sales Return
exports.updateSalesReturn = async (req, res) => {
  try {
    const { returnId } = req.params;
    const {
      returnDate,
      saleId,
      customer,
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

    const salesReturn = await SalesReturn.findById(returnId);
    if (!salesReturn)
      return res.status(404).json({ message: "Sales return not found" });

    // 🔄 Step 1: Rollback old stock
    for (const oldItem of salesReturn.returnItems) {
      await Product.findByIdAndUpdate(
        oldItem.productId,
        {
          $inc: {
            saleReturnQuantity: -oldItem.quantity,
            saleQuantity: oldItem.quantity,
            stockQuantity: -oldItem.quantity,
          },
        },
        { new: true }
      );
    }

    // 🔍 Step 2: Validate new return items
    const sale = await Sale.findById(saleId || salesReturn.sale);
    if (!sale) {
      return res.status(404).json({ message: "Related sale not found" });
    }

    for (const item of returnItems) {
      const soldItem = sale.saleItems.find(
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
            saleReturnQuantity: item.quantity,
            saleQuantity: -item.quantity,
            stockQuantity: item.quantity,
          },
        },
        { new: true }
      );
    }

    // 📝 Step 4: Update sales return record
    salesReturn.returnDate = returnDate || salesReturn.returnDate;
    salesReturn.sale = saleId || salesReturn.sale;
    salesReturn.customer = customer || salesReturn.customer;
    salesReturn.returnAmount = returnAmount || salesReturn.returnAmount;
    salesReturn.invoiceNo = invoiceNo || salesReturn.invoiceNo;
    salesReturn.reason = reason || salesReturn.reason;
    salesReturn.paymentType = paymentType || salesReturn.paymentType;
    salesReturn.paymentStatus = paymentStatus || salesReturn.paymentStatus;
    salesReturn.amountPaid = amountPaid || salesReturn.amountPaid;
    salesReturn.dueBalance = dueBalance || salesReturn.dueBalance;
    salesReturn.subTotal = subTotal || salesReturn.subTotal;
    salesReturn.otherCharges = otherCharges || salesReturn.otherCharges;
    salesReturn.discount = discount || salesReturn.discount;
    salesReturn.discountValue = discountValue || salesReturn.discountValue;
    salesReturn.shipping = shipping || salesReturn.shipping;
    salesReturn.returnItems = returnItems;
    salesReturn.userId = userId || salesReturn.userId;

    await salesReturn.save();

    res.status(200).json({
      message: "Sales return updated successfully",
      return: salesReturn,
    });
  } catch (error) {
    console.error("❌ Update Sales Return Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Delete Sales Return
exports.deleteSalesReturn = async (req, res) => {
  try {
    const { returnId } = req.params;

    const salesReturn = await SalesReturn.findById(returnId);
    if (!salesReturn)
      return res.status(404).json({ message: "Sales return not found" });

    // Rollback stock (remove returned qty from stock)
    for (const item of salesReturn.returnItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            saleReturnQuantity: -item.quantity,
            saleQuantity: item.quantity,
            stockQuantity: -item.quantity,
          }, // + added
        },
        { new: true }
      );
    }

    await salesReturn.deleteOne();

    res.status(200).json({ message: "Sales return deleted and sale restored" });
  } catch (error) {
    console.error("❌ Delete Sales Return Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 📌 Bulk Delete Sales Returns
exports.bulkDeleteSalesReturns = async (req, res) => {
  try {
    const { ids } = req.body; // array of return IDs
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No return IDs provided" });
    }

    const salesReturns = await SalesReturn.find({ _id: { $in: ids } });

    for (const salesReturn of salesReturns) {
      // 1️⃣ Rollback stock in Product
      for (const item of salesReturn.returnItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              saleReturnQuantity: -item.quantity,
              saleQuantity: item.quantity,
              stockQuantity: -item.quantity,
            },
          },
          { new: true }
        );
      }

      // 2️⃣ Restore quantities back into original Sale.saleItems
      const sale = await Sale.findById(salesReturn.sale);
      if (sale) {
        sale.saleItems = sale.saleItems.map((si) => {
          const returnedItem = salesReturn.returnItems.find(
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
        await sale.save();
      }

      // 3️⃣ Delete the return
      await salesReturn.deleteOne();
    }

    res
      .status(200)
      .json({ message: "Selected sales returns deleted successfully" });
  } catch (error) {
    console.error("❌ Bulk Delete Sales Returns Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
