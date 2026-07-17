const cron = require("node-cron");
const Product = require("../models/Product");
const Company = require("../models/Company");
const sendEmail = require("../utils/sendMail");

// ⏰ Run every day at 9 AM
// cron.schedule("0 9 * * *", async () => {

cron.schedule("0 13 * * *", async () => {
  try {
    const today = new Date();

    // Get active products with expiration date
    const products = await Product.find({
      expirationDate: { $ne: null, $gte: today },
      status: "ON",
    });

    for (const product of products) {
      const exp = new Date(product.expirationDate);

      // Calculate month difference
      const diffMonths =
        (exp.getFullYear() - today.getFullYear()) * 12 +
        (exp.getMonth() - today.getMonth());

      let alertLabel = null;

      // 🔔 Determine which alert to send
      if (diffMonths === 6 && !product.expirationAlerts.sixMonths) {
        alertLabel = "6 Months";
        product.expirationAlerts.sixMonths = true;
      } else if (diffMonths === 3 && !product.expirationAlerts.threeMonths) {
        alertLabel = "3 Months";
        product.expirationAlerts.threeMonths = true;
      } else if (diffMonths === 2 && !product.expirationAlerts.twoMonths) {
        alertLabel = "2 Months";
        product.expirationAlerts.twoMonths = true;
      } else if (diffMonths === 1 && !product.expirationAlerts.oneMonth) {
        alertLabel = "1 Month";
        product.expirationAlerts.oneMonth = true;
      }

      // Nothing to send today
      if (!alertLabel) continue;

      // Get company email
      const company = await Company.findOne({ userId: product.userId });
      const adminEmail = company?.companyEmail || process.env.EMAIL_USER;

      // 📧 Send email
      await sendEmail(
        adminEmail,
        `⏰ PRODUCT EXPIRATION ALERT — ${alertLabel}`,

        // Plain text (fallback)
        `Product: ${product.title}
        Expiration Date: ${exp.toDateString()}
        Stock Quantity: ${product.stockQuantity}

⚠️ This product will expire in ${alertLabel}.
Please take action.`,

        // HTML email
        `
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <h2 style="color:#e63946;">⏰ Product Expiration Alert</h2>
          <p><strong>Product:</strong> ${product.title}</p>
          <p><strong>Expiration Date:</strong> ${exp.toDateString()}</p>
          <p><strong>Stock Quantity:</strong> ${product.stockQuantity}</p>
          <hr />
          <p style="color:red; font-size: 16px;">
            ⚠️ This product will expire in <strong>${alertLabel}</strong>.
          </p>
        </div>
        `
      );

      // ✅ Save alert status to prevent duplicates
      await product.save();
    }

    console.log("✅ Expiration alert cron job finished");
  } catch (error) {
    console.error("❌ Expiration alert cron error:", error);
  }
});
