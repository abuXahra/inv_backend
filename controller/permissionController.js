// controllers/permissionController.js
const Permission = require("../models/Permission");
const User = require("../models/User");
const logActivity = require("../utils/activityLogger");

// ✅ Add new module permission(s) (supports multiple roles at once)
exports.addPermissionModule = async (req, res) => {
  try {
    const { module, canVisit, canView, canAdd, canEdit, canDelete } = req.body;

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
      canVisit: canVisit || false,
      canView: canView || false,
      canAdd: canAdd || false,
      canEdit: canEdit || false,
      canDelete: canDelete || false,
    });

    await permission.save();

    // Activity log
    await logActivity({
      user: req.user,
      action: "UPDATE",
      module: "Permission",
      documentId: permission._id,
      description: `Updated permission for "${permission.module}"`,
      newData: {
        title: permission.module,
        code: "",
        status: "",
      },
    });

    res.status(201).json({
      message: "Module permission created successfully.",
      permission,
    });
  } catch (error) {
    console.error("Error adding permission module:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// // Get all permissions
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get all permissions
exports.getSinglePermissions = async (req, res) => {
  try {
    const permissions = await Permission.find();
    res.json(permissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get a single permission module
exports.getSinglePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const permission = await Permission.findById(permissionId);
    if (!permission)
      return res.status(404).json({ message: "Permission not found." });
    res.json(permission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update a single permission module
exports.updateSinglePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { module, canVisit, canView, canAdd, canEdit, canDelete, roles } =
      req.body;
    const user = req.user; // comes from verifyToken

    const updatedPermission = await Permission.findByIdAndUpdate(
      permissionId,
      {
        ...(module && { module }),
        ...(canVisit !== undefined && { canVisit }),
        ...(canView !== undefined && { canView }),
        ...(canAdd !== undefined && { canAdd }),
        ...(canEdit !== undefined && { canEdit }),
        ...(canDelete !== undefined && { canDelete }),
        ...(roles && { roles }),
      },
      { new: true },
    );

    if (!updatedPermission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    // Activity log
    await logActivity({
      user,
      action: "UPDATE",
      module: "Permission",
      documentId: updatedPermission._id,
      description: `Updated permission for "${updatedPermission.module}"`,
      newData: {
        title: updatedPermission.module,
        code: "",
        status: "",
      },
    });

    res.json({
      success: true,
      message: "Permission updated successfully.",
      permission: updatedPermission,
    });
  } catch (error) {
    console.error("Error updating permission:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ✅ Delete a permission module
exports.deletePermission = async (req, res) => {
  try {
    const permissionId = req.params.permissionId;

    const permission = await Permission.findByIdAndDelete(permissionId);

    if (!permission) {
      return res.status(404).json({ message: "Permission not found." });
    }

    // Remove this permission from all users
    await User.updateMany({}, { $pull: { permissions: permission._id } });

    res.json({
      success: true,
      message: "Permission deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting permission:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ✅ Update all permissions (bulk update and enforce)
exports.updateAllPermissions = async (req, res) => {
  try {
    const updatedPermissions = req.body.permissions; // [{title, add, edit, view, delete}]

    if (!updatedPermissions || !Array.isArray(updatedPermissions))
      return res.status(400).json({ message: "Invalid permissions data." });

    // Upsert permissions by module
    for (const perm of updatedPermissions) {
      await Permission.findOneAndUpdate(
        { module: perm.title },
        {
          module: perm.title,
          canVisit: perm.visit,
          canAdd: perm.add,
          canEdit: perm.edit,
          canView: perm.view,
          canDelete: perm.delete,
        },
        { upsert: true, new: true },
      );
    }

    // Fetch all permissions
    const allPermissions = await Permission.find();

    // Enforce permissions to all "user" roles
    await User.updateMany(
      { role: "user" },
      { $set: { permissions: allPermissions.map((p) => p._id) } },
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
