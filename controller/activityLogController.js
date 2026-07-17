const ActivityLog = require("../models/ActivityLog");
const Category = require("../models/Category");
const Company = require("../models/Company");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Expense = require("../models/Expense");
const Payment = require("../models/Payment");
const Permission = require("../models/Permission");
const Purchase = require("../models/Purchase");
const PurchaseReturn = require("../models/PurchaseReturn");
const Sale = require("../models/Sale");
const SaleReturn = require("../models/SaleReturn");
const Supplier = require("../models/Supplier");
const Tax = require("../models/Tax");
const Unit = require("../models/Unit");
const User = require("../models/User");
const Wastage = require("../models/Wastage");

// import other models if needed, e.g., Sale, User, etc.

const MODULE_MODELS = {
  Category,
  Product,
  Company,
  Customer,
  Expense,
  Payment,
  Permission,
  Purchase,
  PurchaseReturn,
  Sale,
  SaleReturn,
  Supplier,
  Tax,
  Unit,
  User,
  Wastage,
  ActivityLog,
};

exports.getActivityLogs = async (req, res) => {
  try {
    const { action, module, user, startDate, endDate, documentId } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (module) filter.module = module;
    if (user) filter.user = user;
    if (documentId) filter.documentId = documentId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    let logs = await ActivityLog.find(filter)
      .populate("user", "username email role")
      .sort({ createdAt: -1 });
    // .skip((page - 1) * limit)
    // .limit(Number(limit));

    // Dynamically populate document data based on module
    logs = await Promise.all(
      logs.map(async (log) => {
        const Model = MODULE_MODELS[log.module];
        if (Model && log.documentId) {
          const document = await Model.findById(log.documentId);
          return { ...log.toObject(), document };
        }
        return log.toObject();
      }),
    );

    const total = await ActivityLog.countDocuments(filter);

    res.json({
      data: logs,
      // pagination: {
      //   total,
      //   page: Number(page),
      //   pages: Math.ceil(total / limit),
      // },
    });
  } catch (error) {
    console.error("Get activity logs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteActivityLog = async (req, res) => {
  try {
    const activityId = req.params.activityId;
    const user = req.user;

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const log = await ActivityLog.findById(activityId);
    if (!log) return res.status(404).json({ message: "Log not found" });

    await ActivityLog.findByIdAndDelete(activityId);

    res.json({ message: "Activity log deleted successfully" });
  } catch (error) {
    console.error("Delete activity log error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.bulkDeleteActivityLogs = async (req, res) => {
  try {
    const user = req.user;
    const { ids } = req.body; // array of activity log IDs

    // 🔒 Admin only
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // 🛑 Validate payload
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No activity log IDs provided" });
    }

    // 🧾 Optional: ensure logs exist before deleting
    const logs = await ActivityLog.find({ _id: { $in: ids } });

    if (logs.length === 0) {
      return res.status(404).json({ message: "No activity logs found" });
    }

    // 🗑 Bulk delete
    const result = await ActivityLog.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      message: `${result.deletedCount} activity logs deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk delete activity logs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
