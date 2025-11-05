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
const saleRoute = require("./routes/sale");
const paymentRoute = require("./routes/payment");
const saleReturnRoute = require("./routes/saleReturn");
const purchaseReturnRoute = require("./routes/purchaseReturn");
const wastageRoute = require("./routes/wastage");
const reportRoute = require("./routes/report");
const permissionRoute = require("./routes/permission");

const port = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    "https://inventory.jewelszenithgalore.com.ng",
    "https://inventory-management-system-xcvp.onrender.com",
    "http://localhost:3000",
    "http://localhost:3001",
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
app.use("/api/sale", saleRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/saleReturn", saleReturnRoute);
app.use("/api/purchaseReturn", purchaseReturnRoute);
app.use("/api/wastage", wastageRoute);
app.use("/api/reports", reportRoute);
app.use("/api/permission", permissionRoute);

// Image upload route
// const storage = multer.diskStorage({
//   destination: (req, file, fn) => {
//     fn(null, "images");
//   },
//   filename: (req, file, fn) => {
//     // fn(null, req.body.img)
//     fn(null, file.originalname);
//   },
// });

// const upload = multer({ storage });
// app.post("/api/upload", upload.single("file"), (req, res) => {
//   res.status(200).json("Image has been uploaded successfully");
// });

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images"); // Make sure the 'images' folder exists
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // You may want to sanitize or make this unique in production
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // ✅ Limit to 10MB
  },
});

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
