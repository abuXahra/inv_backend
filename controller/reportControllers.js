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
