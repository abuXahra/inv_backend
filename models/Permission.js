const mongoose = require("mongoose");

const PermissionSchema = new mongoose.Schema({
  module: { type: String, required: true }, // e.g. "category"
  canView: { type: Boolean, default: true },
  canAdd: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
});

module.exports = mongoose.model("Permission", PermissionSchema);
