const jwt = require("jsonwebtoken");

// const verifyToken = (req, res, next) => {
//   const token = req.cookies.token;
//   if (!token) {
//     return res.status(401).json("You are not authenticated!");
//   }
//   jwt.verify(token, process.env.MONGODB_SECRETE, async (err, data) => {
//     if (err) {
//       return res.status(403).json("Token is not valid!");
//     }
//     req.userId = data._id;
//     next();
//   });
// };

// module.exports = verifyToken;

// middleware/verifyToken.js

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.MONGODB_SECRETE);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

module.exports = verifyToken;
