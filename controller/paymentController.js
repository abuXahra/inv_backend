const Payment = require("../models/Payment");

// create payment width payment Initial
exports.registerPayment = async (req, res) => {
  try {
    const {
      paymentDate,
      paymentFor,
      invoiceNo,
      dueAmount,
      paymentType,
      payableAmount,
      note,
      userId,
    } = req.body;

    // Find the last payment with the same prefix
    const lastPayment = await Payment.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;

    if (lastPayment && lastPayment.code) {
      const match = lastPayment.code.match(/\d+$/); // Extract the numeric part from the code
      if (match) {
        lastSerial = parseInt(match[0], 10);
      }
    }

    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;

    // Create  instance
    const newPayment = new Payment({
      paymentDate,
      paymentFor,
      invoiceNo,
      dueAmount,
      paymentType,
      payableAmount,
      note,
      code,
      userId,
    });

    const savedPayment = await newPayment.save();
    res.status(200).json({
      message: "Payment saved successfully",
      savedPayment,
    });
  } catch (error) {
    res.status(500).json({ message: `Internal server error ${error}`, error });
  }
};

// get all Payment
exports.fetchAllPayment = async (req, res) => {
  try {
    const payment = await Payment.find({});
    res.status(200).json(payment);
  } catch (error) {
    console.log(error);
  }
};

// get Payment
exports.fetchPayment = async (req, res) => {
  const paymentId = req.params.paymentId;
  try {
    const payment = await Payment.findById(paymentId);
    res.status(200).json(payment);
  } catch (error) {
    console.log(error);
  }
};

// update payment
exports.updatePayment = async (req, res) => {
  try {
    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.paymentId,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedPayment);
  } catch (err) {
    res.status(500).json(err);
  }
};

// delete payment
exports.deletePayment = async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    const payment = await Payment.findByIdAndDelete(paymentId);
    return res
      .status(200)
      .json({ payment, message: "payment deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};

// bulk delete
exports.bulkDeletePayment = async (req, res) => {
  try {
    const { ids } = req.body; // Expecting an array of IDs
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No payment IDs provided." });
    }

    // Delete payment by IDs
    const result = await Payment.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No payment found to delete." });
    }

    res.status(200).json({
      message: `${result.deletedCount} payments deleted successfully.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during bulk delete." });
  }
};
