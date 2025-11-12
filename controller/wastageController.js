const Wastage = require("../models/Wastage");
const Product = require("../models/Product");
const Purchase = require("../models/Purchase");

// @desc Create one or multiple wastage records
// @route POST /api/wastage
// @access Private
// create Expense width expenses Initial
exports.createWastage1 = async (req, res) => {
  try {
    const data = req.body;
    const prefix = data.prefix;

    // Find the last expense with the same prefix
    const lastWastage = await Wastage.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;

    if (lastWastage && lastWastage.code) {
      const match = lastWastage.code.match(/\d+$/); // Extract the numeric part from the code
      if (match) {
        lastSerial = parseInt(match[0], 10);
      }
    }

    // For multiple items
    if (Array.isArray(data.items)) {
      const newWastages = data.items.map((item, index) => {
        const serial = (lastSerial + index + 1).toString().padStart(4, "0");
        const code = `${prefix}${serial}`;
        return { ...item, code };
      });

      const savedWastages = await Wastage.insertMany(newWastages);
      return res.status(201).json({
        message: "Wastage added successfully",
        wastage: savedWastages,
      });
    }

    // For single item
    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;

    const newWastage = new Wastage({ ...data, code });
    const savedWastage = await newWastage.save();

    res.status(201).json({
      message: "Wastage added successfully",
      expense: savedWastage,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createWastage = async (req, res) => {
  const session = await Wastage.startSession();
  session.startTransaction();

  try {
    const data = req.body;
    const prefix = data.prefix;

    // Find last wastage for code sequence
    const lastWastage = await Wastage.findOne({
      code: { $regex: `^${prefix}` },
    })
      .sort({ code: -1 })
      .exec();

    let lastSerial = 0;
    if (lastWastage && lastWastage.code) {
      const match = lastWastage.code.match(/\d+$/);
      if (match) lastSerial = parseInt(match[0], 10);
    }

    // For multiple wastage items
    if (Array.isArray(data.items)) {
      const newWastages = [];

      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const serial = (lastSerial + i + 1).toString().padStart(4, "0");
        const code = `${prefix}${serial}`;
        const newItem = { ...item, code };
        newWastages.push(newItem);

        // Update Product stock & wastage quantity
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              stockQuantity: -item.quantity,
              wasteQuantity: item.quantity,
            },
          },
          { session }
        );
      }

      const savedWastages = await Wastage.insertMany(newWastages, { session });

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        message: "Wastages added successfully",
        wastage: savedWastages,
      });
    }

    // Single wastage case
    const serial = (lastSerial + 1).toString().padStart(4, "0");
    const code = `${prefix}${serial}`;

    const newWastage = new Wastage({ ...data, code });
    const savedWastage = await newWastage.save({ session });

    // Update Product stock & wastage quantity
    await Product.findByIdAndUpdate(
      data.productId,
      {
        $inc: {
          stockQuantity: -data.quantity,
          wasteQuantity: data.quantity,
        },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Wastage added successfully",
      wastage: savedWastage,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error creating wastage:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// get all Wastage
exports.fetchAWastage = async (req, res) => {
  try {
    const wastage = await Wastage.find({});
    res.status(200).json(wastage);
  } catch (error) {
    console.log(error);
  }
};

exports.deleteWastage = async (req, res) => {
  const wastageId = req.params.wastageId;
  const session = await Wastage.startSession();
  session.startTransaction();

  try {
    const wastage = await Wastage.findById(wastageId);
    if (!wastage) {
      return res.status(404).json({ message: "Wastage not found" });
    }

    await Product.findByIdAndUpdate(
      wastage.productId,
      {
        $inc: {
          stockQuantity: wastage.quantity,
          wasteQuantity: -wastage.quantity,
        },
      },
      { session }
    );

    await Wastage.findByIdAndDelete(wastageId, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Wastage deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting wastage:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.bulkDeleteWastages = async (req, res) => {
  const { ids } = req.body; // expect array of wastage IDs
  const session = await Wastage.startSession();
  session.startTransaction();

  try {
    const wastages = await Wastage.find({ _id: { $in: ids } });

    for (const wastage of wastages) {
      await Product.findByIdAndUpdate(
        wastage.productId,
        {
          $inc: {
            stockQuantity: wastage.quantity,
            wasteQuantity: -wastage.quantity,
          },
        },
        { session }
      );
    }

    await Wastage.deleteMany({ _id: { $in: ids } }, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Wastages deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error bulk deleting wastages:", error);
    res.status(500).json({ message: "Server error" });
  }
};
