const { default: mongoose } = require("mongoose");
const Sale = require("../models/Sale");
const SalesReturn = require("../models/SaleReturn");
const Product = require("../models/Product");
const Payment = require("../models/Payment");

// register sale data
exports.saleRegister = async (req, res) => {
  try {
    const {
      saleDate,
      customer,
      saleStatus,
      walkingCustomerEmail,
      walkingCustomerNumber,
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

    // Prevent saving sale with no items
    if (!saleItems || saleItems.length === 0) {
      return res.status(400).json({
        message: "Sale items cannot be empty.",
      });
    }

    // ================================
    // 1. GENERATE SALE CODE
    // ================================
    const lastSale = await Sale.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;
    if (lastSale && lastSale.code) {
      const match = lastSale.code.match(/\d+$/);
      if (match) lastSerial = parseInt(match[0], 10);
    }

    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;

    // FORMAT ITEMS
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

    // ================================
    // 2. CHECK STOCK FOR ALL PRODUCTS (SAFE)
    // ================================
    for (const item of cleanedItems) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(400).json({
          message: `Product not found: ${item.title}`,
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for product: ${item.title}`,
        });
      }
    }

    // ================================
    // 3. CREATE THE SALE NOW
    // ================================
    const newSale = new Sale({
      code,
      saleDate,
      customer,
      saleStatus,
      walkingCustomerEmail,
      walkingCustomerNumber,
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

    // PAYMENT LOGIC
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
    }

    await newSale.save();

    // ================================
    // 4. SAVE PAYMENT RECORD IF NEEDED
    // ================================
    if (paymentStatus === "paid" || paymentStatus === "partial") {
      await Payment.create({
        paymentDate: saleDate, // value from saleDate
        paymentFor: code, // sale code (e.g. SA0001)
        invoiceNo: code, // same as paymentFor
        dueBalance: newSale.dueBalance, // remaining balance
        payableAmount: newSale.amountPaid, // how much was paid NOW
        paymentType: paymentType, // cash/card/online etc.
        note,
        userId,
      });
    }

    // ================================
    // 5. ATOMIC STOCK UPDATE PER ITEM
    // ================================
    for (const item of cleanedItems) {
      const update = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stockQuantity: { $gte: item.quantity }, // prevent negative stock
        },
        {
          $inc: {
            saleQuantity: item.quantity,
            stockQuantity: -item.quantity,
          },
        },
        { new: true }
      );

      if (!update) {
        return res.status(400).json({
          message: `Not enough stock for product: ${item.title}`,
        });
      }
    }

    // ================================
    // SUCCESS
    // ================================
    res.status(200).json({
      message: "Sale saved successfully",
      sale: newSale,
    });
  } catch (error) {
    console.error("Sale Register Error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
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
      })
      .sort({ createdAt: -1 });
    res.status(200).json(sale);
  } catch (err) {
    res.status(500).json(err);
  }
};

// ========================================
// fetch all sales for a particular customer
// ========================================
exports.fetchSalesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params; // get customer ID from route params

    const sales = await Sale.find({ customer: customerId }) // filter by customer
      .populate({
        path: "userId",
        select: "username",
      })
      .populate({
        path: "customer",
        select: "name email code",
      })
      .populate({
        path: "saleItems.productId",
        select: "title salePrice",
      })
      .sort({ createdAt: -1 }); // latest first

    res.status(200).json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET total paid and total outstanding for a particular customer
// Controller to get total paid and total outstanding for a customer
exports.getCustomerPaymentSummary = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Fetch all sales for the customer
    const sales = await Sale.find({ customer: customerId });

    if (!sales.length) {
      return res.status(404).json({
        success: false,
        message: "No sales found for this customer",
      });
    }

    let totalPaid = 0;
    let totalOutstanding = 0;

    sales.forEach((sale) => {
      // Total Paid: sum amountPaid for partial or fully paid sales
      if (sale.paymentStatus === "paid" || sale.paymentStatus === "partial") {
        totalPaid += sale.amountPaid;
      }

      // Total Outstanding: sum dueBalance
      totalOutstanding += sale.dueBalance;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalPaid,
        totalOutstanding,
      },
    });
  } catch (error) {
    console.error("Error fetching customer payment summary:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================
// FETCH CUSTOMER OUTSTANDING SALES
// ========================
exports.getCustomerOutstandingSales = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    // Fetch only outstanding sales (dueBalance > 0)
    const outstandingSales = await Sale.find({
      customer: customerId,
      dueBalance: { $gt: 0 }, // Only unpaid or partial
    })
      .populate("customer", "name email phoneNumber code")
      .populate("saleItems.productId", "title salePrice"); // optional

    res.status(200).json({
      success: true,
      count: outstandingSales.length,
      outstandingSales,
    });
  } catch (error) {
    console.error("Error fetching outstanding sales:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch outstanding sales",
    });
  }
};

// ==============================
// UPDATE SALE (SAFE VERSION WITH PAYMENT LOGIC)
// ==============================

exports.saleUpdate = async (req, res) => {
  const saleId = req.params.saleId;

  try {
    const {
      saleDate,
      customer,
      saleStatus,
      walkingCustomerEmail,
      walkingCustomerNumber,
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

    // ============================
    // 0. VALIDATE SALE ITEMS
    // ============================
    if (!saleItems || saleItems.length === 0) {
      return res.status(400).json({
        message: "Sale items cannot be empty.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      return res.status(400).json({ message: "Invalid sale ID" });
    }

    // ============================
    // 1. GET OLD SALE
    // ============================
    const oldSale = await Sale.findById(saleId);
    if (!oldSale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    // ============================
    // 2. ROLLBACK OLD STOCK
    // ============================
    for (const item of oldSale.saleItems) {
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

    // ============================
    // 3. CLEAN NEW SALE ITEMS
    // ============================
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

    // ============================
    // 4. STOCK VALIDATION
    // ============================
    for (const item of cleanedItems) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(400).json({
          message: `Product not found: ${item.title}`,
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for product: ${item.title}`,
        });
      }
    }

    // ============================
    // 5. PAYMENT LOGIC
    // ============================
    const updateData = {
      saleDate,
      customer,
      saleStatus,
      walkingCustomerEmail,
      walkingCustomerNumber,
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
    };

    // Reset amounts based on payment status
    if (paymentStatus === "unpaid") {
      updateData.amountPaid = 0;
      updateData.dueBalance = saleAmount;

      // DELETE existing payment if any
      await Payment.deleteMany({ paymentFor: oldSale.code });
    } else if (paymentStatus === "paid") {
      updateData.amountPaid = saleAmount;
      updateData.dueBalance = 0;

      // Check if payment record exists
      const existingPayment = await Payment.findOne({
        paymentFor: oldSale.code,
      });
      if (existingPayment) {
        // If amountPaid changed, update it
        if (existingPayment.payableAmount !== saleAmount) {
          existingPayment.payableAmount = saleAmount;
          existingPayment.paymentDate = saleDate;
          existingPayment.paymentType = paymentType;
          await existingPayment.save();
        }
      } else {
        // Create payment record
        await Payment.create({
          paymentDate: saleDate,
          paymentFor: oldSale.code,
          invoiceNo: oldSale.code,
          dueBalance: 0,
          payableAmount: saleAmount,
          paymentType,
          note,
          userId,
        });
      }
    } else if (paymentStatus === "partial") {
      const calculatedDue = saleAmount - (amountPaid || 0);
      updateData.dueBalance = calculatedDue;
      updateData.amountPaid = amountPaid || 0;

      const existingPayment = await Payment.findOne({
        paymentFor: oldSale.code,
      });
      if (existingPayment) {
        // If amountPaid changed, update it
        if (existingPayment.payableAmount !== (amountPaid || 0)) {
          existingPayment.payableAmount = amountPaid || 0;
          existingPayment.dueBalance = calculatedDue;
          existingPayment.paymentDate = saleDate;
          existingPayment.paymentType = paymentType;
          await existingPayment.save();
        }
      } else {
        // Create payment record
        await Payment.create({
          paymentDate: saleDate,
          paymentFor: oldSale.code,
          invoiceNo: oldSale.code,
          dueBalance: calculatedDue,
          payableAmount: amountPaid || 0,
          paymentType,
          note,
          userId,
        });
      }
    }

    // ============================
    // 6. UPDATE THE SALE RECORD
    // ============================
    const updatedSale = await Sale.findByIdAndUpdate(saleId, updateData, {
      new: true,
    });

    // ============================
    // 7. APPLY NEW STOCK (ATOMIC)
    // ============================
    for (const item of cleanedItems) {
      const stockUpdate = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stockQuantity: { $gte: item.quantity },
        },
        {
          $inc: {
            saleQuantity: item.quantity,
            stockQuantity: -item.quantity,
          },
        },
        { new: true }
      );

      if (!stockUpdate) {
        return res.status(400).json({
          message: `Not enough stock for product: ${item.title}`,
        });
      }
    }

    // ============================
    // SUCCESS
    // ============================
    res.status(200).json({
      message: "Sale updated successfully",
      sale: updatedSale,
    });
  } catch (error) {
    console.error("❌ Sale Update Error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// DELETE SINGLE
exports.deleteSale = async (req, res) => {
  const saleId = req.params.saleId;

  const session = await Sale.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findById(saleId).session(session);
    if (!sale) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Sale not found" });
    }

    // 1️⃣ Rollback Product stock & sale quantity
    for (const item of sale.saleItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            saleQuantity: -item.quantity,
            stockQuantity: item.quantity,
          },
        },
        { session }
      );
    }

    // 2️⃣ Delete all sales returns linked to this sale
    await SalesReturn.deleteMany({ sale: saleId }, { session });

    // 3️⃣ Delete the sale
    await Sale.findByIdAndDelete(saleId, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Sale, related returns deleted, and stock reversed successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting sale:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// / BULK DELETE sales
exports.bulkDeleteSale = async (req, res) => {
  const { ids } = req.body; // array of sale IDs

  const session = await Sale.startSession();
  session.startTransaction();

  try {
    const sales = await Sale.find({ _id: { $in: ids } }).session(session);

    for (const sale of sales) {
      // 1️⃣ Rollback Product stock & sale quantity
      for (const item of sale.saleItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              saleQuantity: -item.quantity,
              stockQuantity: item.quantity,
            },
          },
          { session }
        );
      }
    }

    // 2️⃣ Delete all related sales returns
    await SalesReturn.deleteMany({ sale: { $in: ids } }, { session });

    // 3️⃣ Delete sales
    await Sale.deleteMany({ _id: { $in: ids } }, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message:
        "Selected sales, related returns deleted, and stock reversed successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error bulk deleting sales:", err);
    res.status(500).json({ message: "Server error" });
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

// Get Total of All Sale Amounts
exports.getTotalSaleAmount = async (req, res) => {
  try {
    const result = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalSale: { $sum: "$saleAmount" },
        },
      },
    ]);

    const total = result[0]?.totalSale || 0;

    res.status(200).json({ totalSaleAmount: total });
  } catch (error) {
    console.error(
      "Error getting total sale amount:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Total amout paid
exports.getTotalAmountPaid = async (req, res) => {
  try {
    const result = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalAmountPaid: { $sum: "$amountPaid" },
        },
      },
    ]);

    const totalAmountPaid = result.length > 0 ? result[0].totalAmountPaid : 0;

    res.status(200).json({
      success: true,
      totalAmountPaid,
    });
  } catch (error) {
    console.error("Error fetching total amount paid:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Total outstanding sale:
exports.getTotalOutstandingSales = async (req, res) => {
  try {
    // 1️⃣ Get total outstanding from Sales
    const result = await Sale.aggregate([
      {
        $match: {
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
