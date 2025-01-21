import jwt from 'jsonwebtoken';

const JWT_SECRET_KEY = process.env.JWT_SECRET

const verifyToken = (req, res, next) => {
  // Extract token from Authorization header
  const token = req.headers['authorization']?.split(' ')[1]; 

  if (!token) {
    return res.status(403).json({ message: 'No token provided', status: false });
  }

  // Verify the token
  jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token', status: false });
    }

    // Attach the decoded information (e.g., user ID) to the request object
    req.user = decoded; // You can add other information based on your JWT payload
    next(); // Proceed to the next middleware or route handler
  });
};

export default verifyToken;
