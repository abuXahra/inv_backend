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
      if (!newSale.amountPaid) {
        newSale.dueBalance = newSale.saleAmount - newSale.amountPaid;
      }
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
            // purchaseQuantity: -item.quantity,
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
        { $inc: { saleQuantity: -item.quantity } }, // rollback
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
        { $inc: { saleQuantity: item.quantity } },
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
            purchaseQuantity: item.quantity,
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
              purchaseQuantity: item.quantity,
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
      paymentStatus: { $in: ["Unpaid", "Partial"] },
    }).select("code customerName saleAmount paymentStatus");

    res.status(200).json(payableSales);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching payable sales", error: err.message });
  }
};
