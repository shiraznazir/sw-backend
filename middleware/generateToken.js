import jwt from 'jsonwebtoken';

const JWT_SECRET_KEY = process.env.JWT_SECRET || "servicewalahsaleemshirazzeeshanhashim";
// ✅ Generate Token
const generateToken = (userId) => {
  
  return jwt.sign({ userId }, JWT_SECRET_KEY, { expiresIn: '24h' });
};

export default generateToken;