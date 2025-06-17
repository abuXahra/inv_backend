const Unit = require("../models/Unit");

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
      { new: true }
    );
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
    return res.status(200).json({ unit, message: "Unit deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};
