import express from 'express';
import twilio from 'twilio';
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';

// Initialize Twilio client at module level
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

// Create a single client instance to be reused
const client = twilio(accountSid, authToken);

// JWT secret - in production, store in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'zoe-app-jwt-secret-key-development-only';
const JWT_EXPIRES_IN = '30d'; // 30 days

// MongoDB connection
const uri = 'mongodb://localhost:27017';
const mongoClient = new MongoClient(uri);

// Phone number hashing function - must match client-side implementation exactly
const generateConsistentHash = (phone) => {
  // Normalize the phone number by removing non-digit characters
  const normalizedPhone = phone.replace(/\D/g, '');
  
  // Fixed salt - should be stored in environment variables in production
  const salt = "Z0E_APP_SALT_37219864";
  
  // Function to create a hash segment
  const hashSegment = (input, seed) => {
    let result = 0;
    const data = input + salt + seed.toString();
    
    // First pass
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      result = ((result << 5) - result) + char;
      result = result & result; // Convert to 32bit integer
    }
    
    // Second pass with different algorithm
    let secondResult = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      secondResult = ((secondResult << 7) + secondResult) ^ char;
      secondResult = secondResult & secondResult;
    }
    
    // Combine results and convert to hex (at least 8 characters)
    const hex = Math.abs(result ^ secondResult).toString(16);
    return hex.padStart(8, '0');
  };
  
  // Create multiple hash segments with deterministic seeds
  const segments = 8; // Will create a 64 character hash
  let hashParts = [];
  
  for (let i = 0; i < segments; i++) {
    // Use deterministic seed for each segment based on input
    const segmentInput = normalizedPhone + i.toString();
    hashParts.push(hashSegment(segmentInput, i));
  }
  
  // Join all segments to create a fixed-length hash
  const fullHash = hashParts.join('');
  
  return fullHash;
};

const router = express.Router();

export default function verificationRoutes(userCollection) {

  // Create a new verification
  router.post('/send', async (req, res) => {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    try {
      const verification = await client.verify.v2
        .services(serviceSid)
        .verifications.create({
          to: phoneNumber,
          channel: 'sms'
        });
      
      // Return the entire verification object directly
      res.status(200).json(verification);
    } catch (error) {
      console.error('Error sending verification code:', error);
      res.status(500).json({
        error: error.message || 'Failed to send verification code'
      });
    }
  });

  // Check verification code
  router.post('/check', async (req, res) => {
    const { phoneNumber, code } = req.body;
    
    if (!phoneNumber || !code) {
      return res.status(400).json({ 
        error: 'Phone number and verification code are required' 
      });
    }

    try {
      // Verify the code with Twilio
      const verificationCheck = await client.verify.v2
        .services(serviceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code: code
        });

      // If verification is successful, hash the phone number
      if (verificationCheck.status === 'approved') {
        // Generate user ID from phone number
        const userId = generateConsistentHash(phoneNumber);
        console.log('Generated user ID from phone:', userId);
        
        // Check if this user already exists in the database
        let user = null;
        
        if (userCollection) {
          // Try to find the user by user_id
          user = await userCollection.findOne({ user_id: userId });
          
          if (user) {
            console.log('User found:', user._id);
            
            // Generate JWT for existing user
            const token = jwt.sign(
              { 
                user_id: user.user_id,
                // Add any other claims needed
              }, 
              JWT_SECRET, 
              { expiresIn: JWT_EXPIRES_IN }
            );
            
            // Add user info and token to the response
            verificationCheck.user = {
              user_id: user.user_id,
              existing_user: true,
              token: token,
              // Include other non-sensitive user data here
            };
          } else {
            console.log('Creating new user with ID:', userId);
            
            // Create a new user entry
            const newUser = {
              user_id: userId,
              phone_hash: userId, // Store the hash as both ID and phone reference
              created_at: new Date(),
              last_login: new Date(),
              // Add additional default fields as needed
              profile_completed: false
            };
            
            // Insert the new user into the database
            const result = await userCollection.insertOne(newUser);
            console.log('New user created with DB ID:', result.insertedId);
            
            // Generate JWT for the new user
            const token = jwt.sign(
              { 
                user_id: userId,
                // Add any other claims needed
              }, 
              JWT_SECRET, 
              { expiresIn: JWT_EXPIRES_IN }
            );
            
            // Add user info and token to the response
            verificationCheck.user = {
              user_id: userId,
              existing_user: false,
              token: token,
              profile_completed: false
            };
          }
        } else {
          console.log('No userCollection available, but generated ID:', userId);
          
          // Even without a database, we can still generate a JWT
          const token = jwt.sign(
            { 
              user_id: userId,
            }, 
            JWT_SECRET, 
            { expiresIn: JWT_EXPIRES_IN }
          );
          
          // Include the ID and token in the response
          verificationCheck.user = {
            user_id: userId,
            existing_user: null,
            token: token
          };
        }
      }

      // Return the enhanced verification check object 
      res.status(200).json(verificationCheck);
    } catch (error) {
      console.error('Error checking verification code:', error);
      res.status(500).json({
        error: error.message || 'Failed to check verification code'
      });
    }
  });

  return router;
}
