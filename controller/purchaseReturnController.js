const PurchaseReturn = require("../models/PurchaseReturn");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");

// Generate unique return code (e.g., "PR-00001")
async function generatePurchaseReturnCode() {
  const count = await PurchaseReturn.countDocuments();
  return `PR-${String(count + 1).padStart(5, "0")}`;
}

// Register Purchase Return
exports.purchaseReturnRegister = async (req, res) => {
  try {
    const { purchaseId, supplier, returnItems, reason, userId } = req.body;

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Validate each return item
    let returnAmount = 0;
    for (const item of returnItems) {
      const purchasedItem = purchase.purchaseItems.find(
        (pi) => pi.productId.toString() === item.productId
      );

      if (!purchasedItem) {
        return res.status(400).json({
          message: `Product ${item.title} was not part of this purchase`,
        });
      }

      if (item.quantity > purchasedItem.quantity) {
        return res.status(400).json({
          message: `Cannot return more than purchased quantity for ${item.title}`,
        });
      }

      // Calculate return amount
      item.amount = item.quantity * item.unitCost;
      returnAmount += item.amount;
    }

    const code = await generatePurchaseReturnCode();

    const newPurchaseReturn = new PurchaseReturn({
      code,
      returnDate: new Date(),
      purchase: purchaseId,
      supplier,
      returnAmount,
      reason,
      returnItems,
      userId,
    });

    await newPurchaseReturn.save();

    // Update stock (decrease the returned items)
    for (const item of returnItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { purchaseQuantity: -item.quantity },
      });
    }

    res.status(201).json({
      message: "Purchase return recorded successfully",
      data: newPurchaseReturn,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all purchase returns
exports.getAllPurchaseReturns = async (req, res) => {
  try {
    const purchaseReturns = await PurchaseReturn.find()
      .populate("purchase")
      .populate("supplier")
      .populate("userId", "name email");

    res.status(200).json(purchaseReturns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single purchase return
exports.getSinglePurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id)
      .populate("purchase")
      .populate("supplier")
      .populate("userId", "name email");

    if (!purchaseReturn) {
      return res.status(404).json({ message: "Purchase return not found" });
    }

    res.status(200).json(purchaseReturn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete purchase return
exports.deletePurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findByIdAndDelete(
      req.params.id
    );

    if (!purchaseReturn) {
      return res.status(404).json({ message: "Purchase return not found" });
    }

    // Rollback stock update
    for (const item of purchaseReturn.returnItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { purchaseQuantity: item.quantity },
      });
    }

    res.status(200).json({ message: "Purchase return deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
