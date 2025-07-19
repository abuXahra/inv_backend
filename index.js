const express = require("express");
const app = express();
const mongoose = require("mongoose");

const dotenv = require("dotenv");

const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const authRoute = require("./routes/auth");
const userRoute = require("./routes/user");
const companyRoute = require("./routes/company");
const unitRoute = require("./routes/unit");
const taxRoute = require("./routes/tax");
const expenseRoute = require("./routes/expense");
const categoryRoute = require("./routes/category");
const customerRoute = require("./routes/customer");
const supplierRoute = require("./routes/supplier");
const productRoute = require("./routes/product");
const purchaseRoute = require("./routes/purchase");

const port = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://inventory-management-system-xcvp.onrender.com",
  ],
  credentials: true,
};

// middlewares
dotenv.config();
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images"))); //to allow uploaded image to be display
app.use(cors(corsOptions)); //to syncronize front and backenth
app.use(cookieParser());

// ROUTES
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/company", companyRoute);
app.use("/api/units", unitRoute);
app.use("/api/tax", taxRoute);
app.use("/api/expense", expenseRoute);
app.use("/api/category", categoryRoute);
app.use("/api/customers", customerRoute);
app.use("/api/suppliers", supplierRoute);
app.use("/api/products", productRoute);
app.use("/api/purchase", purchaseRoute);

// Image upload route
const storage = multer.diskStorage({
  destination: (req, file, fn) => {
    fn(null, "images");
  },
  filename: (req, file, fn) => {
    // fn(null, req.body.img)
    fn(null, file.originalname);
  },
});

const upload = multer({ storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  res.status(200).json("Image has been uploaded successfully");
});

//database connection
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("database connected successfully");
  } catch (err) {
    console.log(err);
  }
};

app.listen(port, () => {
  connectDb();
  console.log(`server is running on port ${port}'`);
});
