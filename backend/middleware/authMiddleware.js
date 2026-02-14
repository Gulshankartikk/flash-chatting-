const jwt = require('jsonwebtoken');
const response = require('../utils/responseHandler');

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

const authMiddleware = (req, res, next) => {
  const authToken = req.cookies?.auth_token;

  if (!authToken) {
    return response(res, 401, 'Authorization token missing. Please provide token');
  }

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return response(res, 401, 'Invalid or expired token');
  }
};

module.exports = authMiddleware;
