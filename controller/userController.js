const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const logActivity = require("../utils/activityLogger");

exports.userUpdate = async (req, res) => {
  try {
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: req.body },
      { new: true },
    );

    // Activity log
    await logActivity({
      user: req.user,
      action: "UPDATE",
      module: "User",
      documentId: updatedUser._id,
      description: `User "${updatedUser.username}" updated`,
      newData: {
        title: updatedUser.username,
        code: "",
        status: "",
      },
    });

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
};

//GET SINGLE USER
exports.userFetch = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId); // Retrieve user from MongoDB by ID
    res.status(200).json(user); // Send user data as JSON response
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL USER
exports.allUsersFetch = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
};

//DELETE
exports.userDelete = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find user and delete it
    const user = await User.findByIdAndDelete(userId);

    // Activity log
    await logActivity({
      user: req.user,
      action: "DELETE",
      module: "User",
      documentId: user._id,
      description: `User "${user.username}" deleted`,
      newData: null,
    });

    return res.status(200).json({ user, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
