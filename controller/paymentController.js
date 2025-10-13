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
    payment.note = note || payment.note;
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
