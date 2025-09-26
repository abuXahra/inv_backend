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
      // invoiceNo,
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
      // invoiceNo,
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
            saleQuantity: -item.quantity, // reduce sold
            // purchaseQuantity: item.quantity, // put back in stock
          },
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
            purchaseQuantity: -oldItem.quantity, // remove previously added back to stock
            saleQuantity: oldItem.quantity, // restore sold qty
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
            purchaseQuantity: item.quantity, // add back to stock
            saleQuantity: -item.quantity, // reduce sold qty
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
            // purchaseQuantity: -item.quantity,
            saleQuantity: item.quantity,
          },
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
              purchaseQuantity: -item.quantity,
              saleQuantity: item.quantity,
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
