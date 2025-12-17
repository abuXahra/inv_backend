const Product = require("../models/Product");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");
const SaleReturn = require("../models/SaleReturn");
const Wastage = require("../models/Wastage");

module.exports = async function recalculateProductStock(productId) {
  const purchases = await Purchase.aggregate([
    { $unwind: "$purchaseItems" },
    { $match: { "purchaseItems.productId": productId } },
    { $group: { _id: null, total: { $sum: "$purchaseItems.quantity" } } },
  ]);

  const sales = await Sale.aggregate([
    { $unwind: "$saleItems" },
    { $match: { "saleItems.productId": productId } },
    { $group: { _id: null, total: { $sum: "$saleItems.quantity" } } },
  ]);

  const saleReturns = await SaleReturn.aggregate([
    { $unwind: "$saleReturnItems" },
    { $match: { "saleReturnItems.productId": productId } },
    { $group: { _id: null, total: { $sum: "$saleReturnItems.quantity" } } },
  ]);

  const purchaseQty = purchases[0]?.total || 0;
  const saleQty = sales[0]?.total || 0;
  const saleReturnQty = saleReturns[0]?.total || 0;

  const stockQuantity = purchaseQty - saleQty + saleReturnQty;

  await Product.findByIdAndUpdate(productId, {
    purchaseQuantity: purchaseQty,
    saleQuantity: saleQty,
    saleReturnQuantity: saleReturnQty,
    stockQuantity,
  });
};
