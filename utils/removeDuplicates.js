// utils/removeDuplicates.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Permission = require("../models/Permission");

dotenv.config({ path: "../.env" });

async function removeDuplicatePermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    const permissions = await Permission.find();
    const unique = new Map();
    let deletedCount = 0;

    for (const perm of permissions) {
      const key = `${perm.userId || "global"}-${perm.module}`;
      if (unique.has(key)) {
        await Permission.findByIdAndDelete(perm._id);
        console.log(
          `🗑️ Removed duplicate for module "${perm.module}" (user ${
            perm.userId || "none"
          })`
        );
        deletedCount++;
      } else {
        unique.set(key, perm._id);
      }
    }

    console.log(`✅ Removed ${deletedCount} duplicate records.`);
  } catch (err) {
    console.error("❌ Error cleaning up permissions:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected.");
  }
}

removeDuplicatePermissions();
