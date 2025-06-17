const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      require: true,
      unique: true,
    },
    status: {
      type: String,
      require: true,
      enum: ["ON", "OFF"],
      default: "ON",
    },

    // code: {
    //   type: String,
    //   required: true,
    //   unique: true,
    // },
    note: {
      type: String,
    },

    imgUrl: {
      type: String,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    // toJSON: { virtuals: true },
    // toObject: { virtuals: true },
  }
);
// Create a virtual field: totalProducts
// CategorySchema.virtual("totalProducts", {
//   ref: "Product",
//   localField: "_id",
//   foreignField: "categoryId",
//   count: true, // Only get the number of products, not the documents
// });

module.exports = mongoose.model("Category", CategorySchema);
