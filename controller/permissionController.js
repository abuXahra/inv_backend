// controllers/permissionController.js
const Permission = require("../models/Permission");
const User = require("../models/User");

// ✅ Add a new module permission
exports.addPermissionModule = async (req, res) => {
  try {
    const { module, canView, canAdd, canEdit, canDelete } = req.body;

    // Validate required field
    if (!module) {
      return res.status(400).json({ message: "Module name is required." });
    }

    // Check for duplicates
    const existing = await Permission.findOne({ module });
    if (existing) {
      return res.status(400).json({ message: "This module already exists." });
    }

    // Create new permission entry
    const permission = new Permission({
      module,
      canView: canView || false,
      canAdd: canAdd || false,
      canEdit: canEdit || false,
      canDelete: canDelete || false,
    });

    await permission.save();

    res.status(201).json({
      message: "Module permission created successfully.",
      permission,
    });
  } catch (error) {
    console.error("Error adding permission module:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Get all permissions
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update all permissions
exports.updateAllPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    for (const perm of permissions) {
      await Permission.updateOne(
        { module: perm.title },
        {
          $set: {
            canAdd: perm.add,
            canEdit: perm.edit,
            canView: perm.view,
            canDelete: perm.delete,
          },
        },
        { upsert: true }
      );
    }

    // Update all 'user' roles to reflect these new permissions
    const updatedPermissions = await Permission.find();

    await User.updateMany(
      { role: "user" },
      { $set: { permissions: updatedPermissions.map((p) => p._id) } }
    );

    res.json({ message: "Permissions updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Enforce permissions globally
exports.updateAllPermissions = async (req, res) => {
  try {
    const updatedPermissions = req.body.permissions; // [{title, add, edit, view, delete}]

    // 1️⃣ Upsert permissions by module name
    for (const perm of updatedPermissions) {
      await Permission.findOneAndUpdate(
        { module: perm.title },
        {
          module: perm.title,
          canAdd: perm.add,
          canEdit: perm.edit,
          canView: perm.view,
          canDelete: perm.delete,
        },
        { upsert: true, new: true }
      );
    }

    // 2️⃣ Get all permissions (unique set)
    const allPermissions = await Permission.find();

    // 3️⃣ Enforce all permissions to every "user"
    await User.updateMany(
      { role: "user" },
      { $set: { permissions: allPermissions.map((p) => p._id) } }
    );

    res.json({
      success: true,
      message: "Permissions updated and enforced for all users.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update permissions." });
  }
};
