import jwt from 'jsonwebtoken';
import 'dotenv/config';

// JWT secret - should match the one used in verificationRoutes
const JWT_SECRET = process.env.JWT_SECRET || 'zoe-app-jwt-secret-key-development-only';

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  // Get the auth header
  const authHeader = req.headers['authorization'];
  
  // Check if authorization header exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // Extract the token from header (remove 'Bearer ' prefix)
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Invalid token format.' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Log the user ID from the token payload
    console.log(`Authenticated request from user_id: ${decoded.user_id}`);
    
    // Add user data to the request object
    req.user = decoded;
    
    // Continue to the endpoint
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(403).json({ error: 'Invalid token.' });
  }
};

export default authenticateToken;