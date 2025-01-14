const { verifyToken } = require('../utils/jwt');

// JWT Authentication Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ message: 'Invalid token, authorization denied' });

  req.userId = decoded.userId;
  next();
};

module.exports = authMiddleware;
