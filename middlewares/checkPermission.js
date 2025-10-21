// middlewares/checkPermission.js
const User = require("../models/User");
const Permission = require("../models/Permission");

const checkPermission = (moduleName, action) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await User.findById(userId).populate("permissions");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // ✅ Admins always have full access
      if (user.role === "admin") return next();

      const userPermissions = user.permissions;

      // ✅ Check if permission for module + action exists
      const hasPermission = userPermissions.some((perm) => {
        return perm.module === moduleName && perm[action] === true;
      });

      if (!hasPermission) {
        return res.status(403).json({
          message: `Access denied: Missing ${action} permission for ${moduleName}.`,
        });
      }

      next();
    } catch (error) {
      console.error("Permission check failed:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
};

module.exports = checkPermission;
