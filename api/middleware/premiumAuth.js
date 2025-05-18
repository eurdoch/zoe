import jwt from 'jsonwebtoken';
import 'dotenv/config';

// JWT secret - should match the one used in verificationRoutes
const JWT_SECRET = process.env.JWT_SECRET || 'zoe-app-jwt-secret-key-development-only';

/**
 * Middleware to verify premium user status
 * First authenticates the JWT token, then checks if user has premium status
 */
const verifyPremiumStatus = (userCollection) => async (req, res, next) => {
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
    
    // Add user data to the request object
    req.user = decoded;
    
    // Extract user_id from token payload
    const { user_id } = decoded;
    
    if (!user_id) {
      return res.status(400).json({ error: 'Invalid user token' });
    }

    // Get user from database and check premium status
    if (userCollection) {
      const user = await userCollection.findOne({ user_id });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user has premium status
      if (!user.premium) {
        return res.status(403).json({ 
          error: 'Premium subscription required',
          message: 'This endpoint requires a premium subscription'
        });
      }
      
      // User has premium status, continue to the endpoint
      console.log(`Premium user authenticated: ${user_id}`);
      next();
    } else {
      // If no database connection, return error
      return res.status(503).json({ error: 'Database service unavailable' });
    }
  } catch (error) {
    console.error('Premium authorization failed:', error.message);
    res.status(403).json({ error: 'Invalid token.' });
  }
};

export default verifyPremiumStatus;
