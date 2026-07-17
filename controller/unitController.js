const Unit = require("../models/Unit");
const logActivity = require("../utils/activityLogger");

// create unit
exports.createUnit = async (req, res) => {
  const { title, note, status } = req.body;

  try {
    const existingTitle = await Unit.findOne({ title });

    if (existingTitle) {
      return res
        .status(400)
        .json({ message: "Unit name already exist. Please use another name" });
    }

    const newUnit = new Unit({ title, note, status });

    const savedUnit = await newUnit.save();

    // Activity log
    await logActivity({
      user: req.user,
      action: "ADD",
      module: "Unit",
      documentId: savedUnit._id,
      description: `Added unit "${savedUnit.title}"`,
      newData: {
        title: savedUnit.title,
        code: savedUnit.code,
        status: savedUnit.status,
      },
    });

    res.status(200).json({ savedUnit, message: "created successfully" });
  } catch (error) {
    console.log(error);
  }
};

// get units
exports.fetchUnits = async (req, res) => {
  try {
    const unit = await Unit.find({});
    res.status(200).json(unit);
  } catch (error) {
    console.log(error);
  }
};

// get unit
exports.fetchUnit = async (req, res) => {
  const unitId = req.params.unitId;
  try {
    const unit = await Unit.findById(unitId);
    res.status(200).json(unit);
  } catch (error) {
    console.log(error);
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const updatedUnit = await Unit.findByIdAndUpdate(
      req.params.unitId,
      { $set: req.body },
      { new: true },
    );

    // Activity log
    await logActivity({
      user: req.user,
      action: "UPDATE",
      module: "Unit",
      documentId: updatedUnit._id,
      description: `Updated a unit "${updatedUnit.title}"`,
      newData: {
        title: updatedUnit.title,
        code: updatedUnit.code,
        status: updatedUnit.status,
      },
    });

    res.status(200).json(updatedUnit);
  } catch (err) {
    res.status(500).json(err);
  }
};

// delete unit
exports.deleteUnit = async (req, res) => {
  try {
    const unitId = req.params.unitId;
    const unit = await Unit.findByIdAndDelete(unitId);

    // Activity log
    await logActivity({
      user: req.user,
      action: "DELETE",
      module: "Unit",
      documentId: unit._id,
      description: `"${unit.title}" is deleted from units `,
      newData: {
        title: unit.title,
        code: unit.code,
        status: "",
      },
    });

    return res.status(200).json({ unit, message: "Unit deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};
