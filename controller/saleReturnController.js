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
            purchaseQuantity: item.quantity, // put back in stock
            saleQuantity: -item.quantity, // reduce sold
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
exports.updateSalesReturn = async (req, res) => {
  try {
    const { returnId } = req.params;
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
      userId,
    } = req.body;

    const salesReturn = await SalesReturn.findById(returnId);
    if (!salesReturn)
      return res.status(404).json({ message: "Sales return not found" });

    // 1️⃣ Rollback old stock
    for (const oldItem of salesReturn.returnItems) {
      await Product.findByIdAndUpdate(
        oldItem.productId,
        {
          $inc: {
            purchaseQuantity: -oldItem.quantity, // remove from stock
            saleQuantity: oldItem.quantity, // restore sold
          },
        },
        { new: true }
      );
    }

    // 2️⃣ Validate new return items
    const sale = await Sale.findById(saleId || salesReturn.sale);
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

    // 3️⃣ Apply new stock
    for (const item of returnItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            purchaseQuantity: item.quantity,
            saleQuantity: -item.quantity,
          },
        },
        { new: true }
      );
    }

    // 4️⃣ Update return record
    salesReturn.returnDate = returnDate || salesReturn.returnDate;
    salesReturn.sale = saleId || salesReturn.sale;
    salesReturn.customer = customer || salesReturn.customer;
    salesReturn.returnAmount = returnAmount || salesReturn.returnAmount;
    salesReturn.reason = reason || salesReturn.reason;
    // salesReturn.invoiceNo = invoiceNo || salesReturn.invoiceNo;
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

    res
      .status(200)
      .json({ message: "Sales return updated", return: salesReturn });
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

    // Rollback stock
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

    await salesReturn.deleteOne();

    res.status(200).json({ message: "Sales return deleted" });
  } catch (error) {
    console.error("❌ Delete Sales Return Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
