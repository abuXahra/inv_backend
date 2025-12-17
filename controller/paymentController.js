const Payment = require("../models/Payment");
const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");

// Register Payment
exports.registerPayment = async (req, res) => {
  try {
    const {
      paymentDate,
      paymentFor,
      payableAmount,
      paymentType,
      note,
      userId,
    } = req.body;

    if (!paymentFor || !payableAmount || !paymentType || !paymentDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let invoiceNo = paymentFor;
    let dueBalance = 0;

    // SALE PAYMENT
    if (paymentFor.startsWith("SA")) {
      const sale = await Sale.findOne({ code: paymentFor });
      if (!sale) return res.status(404).json({ message: "Sale not found" });

      // Update sale payments
      sale.amountPaid += payableAmount;
      sale.dueBalance = sale.saleAmount - sale.amountPaid;

      // ✅ update payment type
      sale.paymentType = paymentType;

      if (sale.dueBalance <= 0) {
        sale.paymentStatus = "paid";
        sale.dueBalance = 0;
      } else if (sale.amountPaid > 0 && sale.dueBalance > 0) {
        sale.paymentStatus = "partial";
      } else {
        sale.paymentStatus = "unpaid";
      }

      await sale.save();
      dueBalance = sale.dueBalance;

      // PURCHASE PAYMENT
    } else if (paymentFor.startsWith("PU")) {
      const purchase = await Purchase.findOne({ code: paymentFor });
      if (!purchase)
        return res.status(404).json({ message: "Purchase not found" });

      purchase.amountPaid += payableAmount;
      purchase.dueBalance = purchase.purchaseAmount - purchase.amountPaid;

      // ✅ update payment type
      purchase.paymentType = paymentType;

      if (purchase.dueBalance <= 0) {
        purchase.paymentStatus = "paid";
        purchase.dueBalance = 0;
      } else if (purchase.amountPaid > 0 && purchase.dueBalance > 0) {
        purchase.paymentStatus = "partial";
      } else {
        purchase.paymentStatus = "unpaid";
      }

      await purchase.save();
      dueBalance = purchase.dueBalance;
    } else {
      return res.status(400).json({ message: "Invalid paymentFor code" });
    }

    // Create Payment record (save updated dueBalance)
    const newPayment = new Payment({
      paymentDate,
      paymentFor,
      invoiceNo,
      dueBalance,
      payableAmount,
      paymentType,
      note,
      userId,
    });

    await newPayment.save();
    res
      .status(201)
      .json({ message: "Payment recorded successfully", payment: newPayment });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Fetch All Payments
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find();
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Single Payment by ID
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate(
      "userId",
      "name email"
    );
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// get Sale Payments
exports.getSalePayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      invoiceNo: { $regex: /^SA/i },
    })
      .populate("userId", "name email")
      .lean();

    const saleCodes = payments.map((p) => p.invoiceNo);

    const sales = await Sale.find({ code: { $in: saleCodes } })
      .populate("customer", "name email phone")
      .lean();

    const saleMap = new Map(sales.map((s) => [s.code, s]));
    const enriched = payments.map((p) => ({
      ...p,
      customer: saleMap.get(p.invoiceNo)?.customer || null,
    }));

    res.status(200).json(enriched);
  } catch (error) {
    console.error("Error fetching sale payments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get Purchase Payments Only
exports.getPurchasePayments = async (req, res) => {
  try {
    // Find all payments whose invoiceNo starts with "PU"
    const payments = await Payment.find({
      invoiceNo: { $regex: /^PU/i },
    })
      .populate("userId", "name email") // Include user info
      .lean();

    // Extract all purchase codes from those payments
    const purchaseCodes = payments.map((p) => p.invoiceNo);

    // Find matching purchase records and populate supplier info
    const purchases = await Purchase.find({ code: { $in: purchaseCodes } })
      .populate("supplier", "name email phone") // Include supplier info
      .lean();

    // Map purchase info to their respective payments
    const purchaseMap = new Map(purchases.map((p) => [p.code, p]));

    const enriched = payments.map((p) => ({
      ...p,
      supplier: purchaseMap.get(p.invoiceNo)?.supplier || null,
      purchaseAmount: purchaseMap.get(p.invoiceNo)?.purchaseAmount || 0,
      paymentStatus: purchaseMap.get(p.invoiceNo)?.paymentStatus || "N/A",
      dueBalance: purchaseMap.get(p.invoiceNo)?.dueBalance ?? p.dueBalance,
    }));

    res.status(200).json(enriched);
  } catch (error) {
    console.error("Error fetching purchase payments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Payment
exports.updatePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const {
      paymentDate,
      paymentFor,
      payableAmount,
      paymentType,
      note,
      userId,
    } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    let invoiceNo = paymentFor || payment.paymentFor;
    let dueBalance = 0;

    // Calculate adjustment (difference between new and old payableAmount)
    const oldAmount = payment.payableAmount;
    const amountDiff = payableAmount - oldAmount;

    // --- SALE PAYMENT ---
    if (invoiceNo.startsWith("SA")) {
      const sale = await Sale.findOne({ code: invoiceNo });
      if (!sale) return res.status(404).json({ message: "Sale not found" });

      // Rollback old payment first
      sale.amountPaid -= oldAmount;

      // Apply new payment
      sale.amountPaid += payableAmount;
      sale.dueBalance = sale.saleAmount - sale.amountPaid;

      if (sale.dueBalance <= 0) {
        sale.paymentStatus = "paid";
        sale.dueBalance = 0;
      } else if (sale.amountPaid > 0 && sale.dueBalance > 0) {
        sale.paymentStatus = "partial";
      } else {
        sale.paymentStatus = "unpaid";
      }

      await sale.save();
      dueBalance = sale.dueBalance;

      // --- PURCHASE PAYMENT ---
    } else if (invoiceNo.startsWith("PU")) {
      const purchase = await Purchase.findOne({ code: invoiceNo });
      if (!purchase)
        return res.status(404).json({ message: "Purchase not found" });

      // Rollback old payment first
      purchase.amountPaid -= oldAmount;

      // Apply new payment
      purchase.amountPaid += payableAmount;
      purchase.dueBalance = purchase.purchaseAmount - purchase.amountPaid;

      if (purchase.dueBalance <= 0) {
        purchase.paymentStatus = "paid";
        purchase.dueBalance = 0;
      } else if (purchase.amountPaid > 0 && purchase.dueBalance > 0) {
        purchase.paymentStatus = "partial";
      } else {
        purchase.paymentStatus = "unpaid";
      }

      await purchase.save();
      dueBalance = purchase.dueBalance;
    } else {
      return res.status(400).json({ message: "Invalid paymentFor code" });
    }

    // --- Update Payment record itself ---
    payment.paymentDate = paymentDate || payment.paymentDate;
    payment.paymentFor = invoiceNo;
    payment.invoiceNo = invoiceNo;
    payment.dueBalance = dueBalance;
    payment.payableAmount = payableAmount;
    payment.paymentType = paymentType || payment.paymentType;
    // payment.note = note || payment.note;
    payment.note = note !== null ? note : payment.note;
    payment.userId = userId || payment.userId;

    await payment.save();

    res.status(200).json({
      message: "Payment updated successfully",
      payment,
    });
  } catch (error) {
    console.error("Update Payment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Payment
exports.deletePayment = async (req, res) => {
  try {
    const paymentId = req.params.paymentId;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const { paymentFor, payableAmount } = payment;

    // If payment was for a SALE
    if (paymentFor.startsWith("SA")) {
      const sale = await Sale.findOne({ code: paymentFor });
      if (sale) {
        // Roll back payment
        sale.amountPaid -= payableAmount;
        if (sale.amountPaid < 0) sale.amountPaid = 0;

        sale.dueBalance = sale.saleAmount - sale.amountPaid;

        if (sale.dueBalance <= 0) {
          sale.paymentStatus = "paid";
          sale.dueBalance = 0;
        } else if (sale.amountPaid > 0) {
          sale.paymentStatus = "partial";
        } else {
          sale.paymentStatus = "unpaid";
        }

        await sale.save();
      }
    }

    // If payment was for a PURCHASE
    else if (paymentFor.startsWith("PU")) {
      const purchase = await Purchase.findOne({ code: paymentFor });
      if (purchase) {
        // Roll back payment
        purchase.amountPaid -= payableAmount;
        if (purchase.amountPaid < 0) purchase.amountPaid = 0;

        purchase.dueBalance = purchase.purchaseAmount - purchase.amountPaid;

        if (purchase.dueBalance <= 0) {
          purchase.paymentStatus = "paid";
          purchase.dueBalance = 0;
        } else if (purchase.amountPaid > 0) {
          purchase.paymentStatus = "partial";
        } else {
          purchase.paymentStatus = "unpaid";
        }

        await purchase.save();
      }
    } else {
      return res.status(400).json({ message: "Invalid paymentFor code" });
    }

    // Delete the payment after rollback
    await Payment.findByIdAndDelete(paymentId);

    res
      .status(200)
      .json({ message: "Payment deleted and records updated successfully" });
  } catch (error) {
    console.error("Delete Payment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.bulkDeletePayment = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Payment IDs provided.",
      });
    }

    // Step 1: Fetch all payments to be deleted
    const payments = await Payment.find({ _id: { $in: ids } });

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching payments found.",
      });
    }

    // Step 2: Process each payment to roll back its effect
    for (const payment of payments) {
      const { paymentFor, payableAmount } = payment;

      if (paymentFor.startsWith("SA")) {
        const sale = await Sale.findOne({ code: paymentFor });
        if (sale) {
          sale.amountPaid -= payableAmount;
          if (sale.amountPaid < 0) sale.amountPaid = 0;

          sale.dueBalance = sale.saleAmount - sale.amountPaid;

          if (sale.dueBalance <= 0) {
            sale.paymentStatus = "paid";
            sale.dueBalance = 0;
          } else if (sale.amountPaid > 0) {
            sale.paymentStatus = "partial";
          } else {
            sale.paymentStatus = "unpaid";
          }

          await sale.save();
        }
      } else if (paymentFor.startsWith("PU")) {
        const purchase = await Purchase.findOne({ code: paymentFor });
        if (purchase) {
          purchase.amountPaid -= payableAmount;
          if (purchase.amountPaid < 0) purchase.amountPaid = 0;

          purchase.dueBalance = purchase.purchaseAmount - purchase.amountPaid;

          if (purchase.dueBalance <= 0) {
            purchase.paymentStatus = "paid";
            purchase.dueBalance = 0;
          } else if (purchase.amountPaid > 0) {
            purchase.paymentStatus = "partial";
          } else {
            purchase.paymentStatus = "unpaid";
          }

          await purchase.save();
        }
      } else {
        console.warn(`Invalid paymentFor code: ${paymentFor}`);
      }
    }

    // Step 3: Delete all payments in one go
    const result = await Payment.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} payments deleted and rollbacks completed.`,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Get Total of All Payable Amounts
exports.getTotalPayableAmount = async (req, res) => {
  try {
    const result = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalPayable: { $sum: "$payableAmount" },
        },
      },
    ]);

    const total = result[0]?.totalPayable || 0;

    res.status(200).json({ totalPayableAmount: total });
  } catch (error) {
    console.error(
      "Error getting total payable amount:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// FETCH CUSTOMER PAYMENT HISTORY
exports.getCustomerPaymentHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required." });
    }

    // 1️⃣ Fetch all sales of this customer
    const sales = await Sale.find({ customer: customerId })
      .select("code")
      .lean();

    const saleCodes = sales.map((s) => s.code);

    // 2️⃣ Fetch all payments linked to any sale by this customer
    const payments = await Payment.find({
      paymentFor: { $in: saleCodes },
    })
      .select("paymentFor payableAmount paymentDate paymentType")
      .sort({ paymentDate: -1 }) // newest first
      .lean();

    // 3️⃣ Convert payments to history format
    const paymentHistory = payments.map((p) => ({
      invoiceNo: p.paymentFor,
      amountPaid: p.payableAmount,
      paymentType: p.paymentType,
      paymentDate: p.paymentDate,
    }));

    return res.status(200).json({
      message: "Customer payment history fetched successfully.",
      paymentHistory,
    });
  } catch (error) {
    console.error("Payment history error:", error);
    res.status(500).json({
      message: "Error fetching customer payment history.",
      error: error.message,
    });
  }
};

// FETCH SUPPLIER PURCHASE PAYMENT HISTORY
exports.getSupplierPaymentHistory = async (req, res) => {
  try {
    const { supplierId } = req.params;

    if (!supplierId) {
      return res.status(400).json({ message: "Supplier ID is required." });
    }

    // 1️⃣ Fetch all purchases of this supplier
    const purchases = await Purchase.find({ supplier: supplierId })
      .select("code")
      .lean();

    const purchaseCodes = purchases.map((p) => p.code);

    // 2️⃣ Fetch all payments linked to these purchases
    const payments = await Payment.find({
      paymentFor: { $in: purchaseCodes },
    })
      .select("paymentFor payableAmount paymentDate paymentType")
      .sort({ paymentDate: 1 })
      .lean();

    // 3️⃣ Convert Payment model records (ONLY SOURCE OF TRUTH)
    const paymentHistory = payments.map((p) => ({
      invoiceNo: p.paymentFor,
      amountPaid: p.payableAmount,
      paymentType: p.paymentType,
      paymentDate: p.paymentDate,
    }));

    // 4️⃣ Sort newest first
    paymentHistory.sort(
      (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
    );

    return res.status(200).json({
      message: "Supplier payment history fetched successfully.",
      paymentHistory,
    });
  } catch (error) {
    console.error("Supplier payment history error:", error);
    res.status(500).json({
      message: "Error fetching supplier payment history.",
      error: error.message,
    });
  }
};
