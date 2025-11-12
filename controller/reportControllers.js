// routes/report.js
const express = require("express");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");
const Product = require("../models/Product");

// Utility to format dates (YYYY-MM-DD)
// const formatDate = (date) => {
//   return date.toISOString().split("T")[0];
// };

exports.salePurchaseReport = async (req, res) => {
  try {
    const purchases = await Purchase.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$purchaseDate" },
          },
          totalPurchase: { $sum: "$purchaseAmount" },
        },
      },
    ]);

    const sales = await Sale.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$saleDate" },
          },
          totalSale: { $sum: "$saleAmount" },
        },
      },
    ]);

    const summaryMap = {};

    purchases.forEach((p) => {
      summaryMap[p._id] = {
        date: p._id,
        purchase: p.totalPurchase,
        sale: 0,
      };
    });

    sales.forEach((s) => {
      if (!summaryMap[s._id]) {
        summaryMap[s._id] = {
          date: s._id,
          purchase: 0,
          sale: s.totalSale,
        };
      } else {
        summaryMap[s._id].sale = s.totalSale;
      }
    });

    const result = Object.values(summaryMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating summary" });
  }
};

// sale report
exports.saleReports = async (req, res) => {
  try {
    const sales = await Sale.aggregate([
      {
        $group: {
          _id: { $month: "$saleDate" },
          totalSales: { $sum: "$saleAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const purchases = await Purchase.aggregate([
      {
        $group: {
          _id: { $month: "$purchaseDate" },
          totalPurchases: { $sum: "$purchaseAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Merge data into a single array by month
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const mergedData = months.map((month, index) => {
      const salesData = sales.find((s) => s._id === index + 1);
      const purchaseData = purchases.find((p) => p._id === index + 1);

      return {
        name: month,
        sales: salesData ? salesData.totalSales : 0,
        profit:
          salesData && purchaseData
            ? salesData.totalSales - purchaseData.totalPurchases
            : salesData
            ? salesData.totalSales
            : 0,
      };
    });

    res.json(mergedData);
  } catch (err) {
    console.error("Error fetching monthly stats", err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getProductSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Optional date filter
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const report = await Sale.aggregate([
      { $match: matchStage },
      { $unwind: "$saleItems" },

      // Lookup Product Info
      {
        $lookup: {
          from: "products",
          localField: "saleItems.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      // Lookup Customer Info
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },

      {
        $group: {
          _id: {
            productId: "$product._id",
            customerId: "$customer._id",
            saleCode: "$code", // invoice code
          },
          invoiceCode: { $first: "$code" },
          productCode: { $first: "$product.code" },
          productTitle: { $first: "$product.title" },
          customerName: { $first: "$customer.name" },
          saleDates: { $addToSet: "$saleDate" },
          totalQuantitySold: { $sum: "$saleItems.quantity" },
          totalSalesAmount: { $sum: "$saleItems.amount" },
        },
      },

      { $sort: { saleDates: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: report.length,
      data: report,
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating sales report",
    });
  }
};

exports.getProductSalesReport1 = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build filter for date range (optional)
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const report = await Sale.aggregate([
      { $match: matchStage },
      { $unwind: "$saleItems" },

      // Lookup product details
      {
        $lookup: {
          from: "products",
          localField: "saleItems.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      // Lookup customer details
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },

      {
        $group: {
          _id: {
            productId: "$product._id",
            customerId: "$customer._id",
          },
          productTitle: { $first: "$product.title" },
          customerName: { $first: "$customer.name" }, // assumes `Customer` schema has a `name` field
          saleDates: { $addToSet: "$saleDate" },
          totalQuantitySold: { $sum: "$saleItems.quantity" },
          totalSalesAmount: { $sum: "$saleItems.amount" },
        },
      },

      { $sort: { totalSalesAmount: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: report.length,
      data: report,
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating sales report",
    });
  }
};

// exports.getProductSalesReport = async (req, res) => {
//   try {
//     // Optional filters (e.g., by date range)
//     const { startDate, endDate } = req.query;

//     // Build match condition for aggregation
//     const matchStage = {};
//     if (startDate && endDate) {
//       matchStage.saleDate = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate),
//       };
//     }

//     // Aggregate sales data grouped by product
//     const report = await Sale.aggregate([
//       { $match: matchStage },
//       { $unwind: "$saleItems" }, // Break out individual items
//       {
//         $lookup: {
//           from: "products", // collection name
//           localField: "saleItems.productId",
//           foreignField: "_id",
//           as: "product",
//         },
//       },
//       { $unwind: "$product" },
//       {
//         $group: {
//           _id: "$product._id",
//           productTitle: { $first: "$product.title" },
//           saleDates: { $addToSet: "$saleDate" }, // collect all sale dates
//           totalQuantitySold: { $sum: "$saleItems.quantity" },
//           totalSalesAmount: { $sum: "$saleItems.amount" },
//         },
//       },
//       { $sort: { totalSalesAmount: -1 } }, // sort by sales
//     ]);

//     res.status(200).json({
//       success: true,
//       count: report.length,
//       data: report,
//     });
//   } catch (error) {
//     console.error("Error generating sales report:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while generating sales report",
//     });
//   }
// };
