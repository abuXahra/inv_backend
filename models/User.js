const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      require: true,
      unique: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
    },

    password: {
      type: String,
    },

    phoneNumber: {
      type: String,
    },

    taxNumber: {
      type: String,
    },

    role: {
      type: String,
      require: true,
      enum: ["admin", "user"],
      default: "user",
    },

    address: {
      type: String,
    },

    imgUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
