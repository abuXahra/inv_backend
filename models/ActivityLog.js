const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    username: {
      type: String,
      required: true,
    },

    action: {
      type: String,
      enum: ["ADD", "UPDATE", "DELETE"],
      required: true,
    },

    module: {
      type: String,
      required: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    description: {
      type: String,
    },

    oldData: {
      type: Object,
    },

    newData: {
      type: Object,
    },
  },
  { timestamps: true }
);

// ✅ CORRECT MODEL NAME
module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
