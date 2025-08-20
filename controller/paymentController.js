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

    let invoiceNo = paymentFor; // same as entered code
    let dueBalance = 0;

    // Check if it's for Sale or Purchase
    if (paymentFor.startsWith("SA")) {
      const sale = await Sale.findOne({ code: paymentFor });
      if (!sale) return res.status(404).json({ message: "Sale not found" });

      dueBalance = sale.dueBalance;

      // Deduct payment from sale
      sale.amountPaid += payableAmount;
      sale.dueBalance = sale.saleAmount - sale.amountPaid;
      if (sale.dueBalance <= 0) {
        sale.paymentStatus = "paid";
        sale.dueBalance = 0;
      }
      await sale.save();
    } else if (paymentFor.startsWith("PU")) {
      const purchase = await Purchase.findOne({ code: paymentFor });
      if (!purchase)
        return res.status(404).json({ message: "Purchase not found" });

      dueAmount = purchase.dueBalance;

      // Deduct payment from purchase
      purchase.amountPaid += payableAmount;
      purchase.dueBalance = purchase.purchaseAmount - purchase.amountPaid;
      if (purchase.dueBalance <= 0) {
        purchase.paymentStatus = "paid";
        purchase.dueBalance = 0;
      }
      await purchase.save();
    } else {
      return res.status(400).json({ message: "Invalid paymentFor code" });
    }

    // Create Payment record
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
    const payments = await Payment.find().populate("userId", "name email");
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Single Payment by ID
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate(
      "userId",
      "name email"
    );
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Payment
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
