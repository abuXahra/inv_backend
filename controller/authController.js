const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Permission = require("../models/Permission");

exports.userRegister = async (req, res) => {
  const {
    username,
    email,
    password,
    phoneNumber,
    taxNumber,
    role,
    address,
    imgUrl,
  } = req.body;

  try {
    const existingUserEmail = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });
    const existingPhone = await User.findOne({ phoneNumber });

    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists." });
    }

    if (existingUserEmail) {
      return res.status(400).json({ message: "Email already exists." });
    }

    if (existingPhone) {
      return res.status(400).json({
        message: "Phone Number already exists.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    let permissionIds = [];
    if (role === "user") {
      // ✅ Fetch the enforced permission set from DB
      const existingPermissions = await Permission.find();

      // ✅ If there are no permissions in DB, you can initialize defaults
      if (existingPermissions.length === 0) {
        const defaultPermissions = [
          {
            module: "Product",
            canVisit: true,
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: false,
          },
          {
            module: "Category",
            canVisit: true,
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: false,
          },
          {
            module: "Customer",
            canVisit: true,
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
          },
          {
            module: "Sale",
            canVisit: true,
            canView: true,
            canAdd: true,
            canEdit: false,
            canDelete: true,
          },
          {
            module: "Supplier",
            canVisit: true,
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
          },
          {
            module: "Purchase",
            canVisit: true,
            canView: true,
            canAdd: true,
            canEdit: false,
            canDelete: true,
          },
          {
            module: "Payment",
            canVisit: true,
            canView: true,
            canAdd: true,
            canEdit: false,
            canDelete: true,
          },
          {
            module: "Expense",
            canVisit: true,
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: false,
          },
          {
            module: "Sale Return",
            canVisit: true,
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: false,
          },
          {
            module: "Purchase Return",
            canVisit: true,
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: false,
          },
          {
            module: "User",
            canVisit: true,
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: false,
          },
          {
            module: "Company",
            canVisit: true,
            canView: true,
            canAdd: false,
            canEdit: false,
            canDelete: false,
          },
          {
            module: "Tax",
            canVisit: true,
            canView: true,
            canAdd: false,
            canEdit: false,
            canDelete: false,
          },
          {
            module: "Unit",
            canVisit: true,
            canView: true,
            canAdd: false,
            canEdit: false,
            canDelete: false,
          },
          {
            module: "Report",
            canVisit: true,
            canView: false,
            canAdd: false,
            canEdit: false,
            canDelete: false,
          },
          {
            module: "Permission",
            canVisit: true,
            canView: false,
            canAdd: false,
            canEdit: false,
            canDelete: false,
          },
        ];
        const inserted = await Permission.insertMany(defaultPermissions);
        permissionIds = inserted.map((p) => p._id);
      } else {
        // ✅ Use existing enforced permissions
        permissionIds = existingPermissions.map((p) => p._id);
      }
    }

    const newUser = new User({
      username,
      email,
      password: hashPassword,
      phoneNumber,
      taxNumber,
      role,
      permissions: permissionIds,
      address,
      imgUrl,
    });
    const savedUser = await newUser.save();
    res
      .status(200)
      .json({ savedUser, message: "User registration successful" });
  } catch (err) {
    res.status(500).json(err);
  }
};

// exports.userLogin = async (req, res) => {
//   try {
//     const user = await User.findOne({ email: req.body.email });
//     if (!user) {
//       return res.status(404).json("User not found");
//     }
//     const match = await bcrypt.compare(req.body.password, user.password);
//     if (!match) {
//       return res.status(401).json("Wrong Credentials");
//     }
//     const token = jwt.sign(
//       { _id: user._id, username: user.username, email: user.email },
//       process.env.MONGODB_SECRETE,
//       { expiresIn: "3d" }
//     );
//     const { password, ...info } = user._doc;
//     res.cookie("token", token).status(200).json(info);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ id: user._id }, process.env.MONGODB_SECRETE, {
    expiresIn: "1d",
  });

  res.json({
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      imgUrl: user.imgUrl,
    },
  });
};

exports.userLogout = async (req, res) => {
  try {
    res
      .clearCookie("token", { sameSite: "none", secure: true })
      .status(200)
      .send("User Logged out Successfully");
  } catch (err) {
    res.status(500).json(err);
  }
};

// REFETCH
// exports.userRefetch = (req, res) => {
//   const token = req.cookies.token;
//   jwt.verify(token, process.env.MONGODB_SECRETE, {}, async (err, data) => {
//     if (err) {
//       return res.status(404).json(err);
//     }
//     res.status(200).json(data);
//   });
// };

// Get logged in user's info using token
exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password")
      .populate("permissions"); // exclude password
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
