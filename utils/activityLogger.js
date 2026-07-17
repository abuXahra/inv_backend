const ActivityLog = require("../models/ActivityLog");

const logActivity = async ({
  user,
  action,
  module,
  documentId,
  description,
  oldData,
  newData,
}) => {
  try {
    if (!user || !user._id) {
      console.warn("⚠️ logActivity skipped: no user");
      return null;
    }

    const log = await ActivityLog.create({
      user: user._id,
      username: user.username,
      action,
      module,
      documentId,
      description,
      oldData,
      newData,
    });

    console.log("📝 Activity log created:", log._id);
    return log;
  } catch (error) {
    console.error("❌ Activity log error:", error);
    return null;
  }
};

module.exports = logActivity;
