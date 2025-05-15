import express from 'express';
import twilio from 'twilio';
import jwt from 'jsonwebtoken';
import authenticateToken from '../middleware/auth.js';

// Initialize Google Play Auth
import { google } from 'googleapis';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('./zotik-456123-92758162bfa1.json', 'utf8')
);
const jwtClient = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  ['https://www.googleapis.com/auth/androidpublisher']
);

// Initialize Twilio client at module level
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

// Create a single client instance to be reused
const client = twilio(accountSid, authToken);

// JWT secret - in production, store in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'zoe-app-jwt-secret-key-development-only';
const JWT_EXPIRES_IN = '90d'; // 3 months
const DEMO_JWT_EXPIRES_IN = '2h'; // 10 minutes for demo account
const DEMO_PHONE_NUMBER = process.env.DEMO_PHONE_NUMBER;

// Phone number hashing function - must match client-side implementation exactly
const generateConsistentHash = (phone) => {
  // Normalize the phone number by removing non-digit characters
  const normalizedPhone = phone.replace(/\D/g, '');
  
  // Fixed salt - should be stored in environment variables in production
  const salt = process.env.SALT;
  
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

    // For demo account, skip actual Twilio verification
    if (phoneNumber === DEMO_PHONE_NUMBER) {
      console.log('Demo account detected, skipping Twilio verification send');
      // Return a mock verification object that looks like Twilio's response
      return res.status(200).json({
        sid: 'demo-verification-sid',
        status: 'pending',
        to: phoneNumber,
        channel: 'sms',
        date_created: new Date().toISOString(),
        valid: true
      });
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
      let verificationStatus = 'pending';
      
      // Check if this is the demo account
      if (phoneNumber === DEMO_PHONE_NUMBER) {
        // Skip Twilio verification for demo account
        console.log('Demo account detected, bypassing Twilio verification');
        verificationStatus = 'approved';
      } else {
        // Verify the code with Twilio for regular accounts
        const verificationCheck = await client.verify.v2
          .services(serviceSid)
          .verificationChecks.create({
            to: phoneNumber,
            code: code
          });
        verificationStatus = verificationCheck.status;
      }

      // If verification is successful, hash the phone number and return user data
      if (verificationStatus === 'approved') {
        // Generate user ID from phone number
        const userId = generateConsistentHash(phoneNumber);
        console.log('Generated user ID from phone:', userId);
        
        // Check if this user already exists in the database
        let user = null;
        let userResponse = null;
        
        if (userCollection) {
          // Try to find the user by user_id
          user = await userCollection.findOne({ user_id: userId });
          
          // Generate JWT for the user with shorter expiration for demo account
          const token = jwt.sign(
            { 
              user_id: userId,
              is_demo: phoneNumber === DEMO_PHONE_NUMBER,
              // Add any other claims needed
            }, 
            JWT_SECRET, 
            { expiresIn: phoneNumber === DEMO_PHONE_NUMBER ? DEMO_JWT_EXPIRES_IN : JWT_EXPIRES_IN }
          );
          
          if (user) {
            console.log('User found:', user._id);
            
            // Update only last login time, don't store the token
            await userCollection.updateOne(
              { user_id: userId },
              { 
                $set: { 
                  last_login: new Date()
                }
              }
            );
            
            // Get the updated user data
            user = await userCollection.findOne({ user_id: userId });
            
            // Create the user response with token but don't store it in DB
            userResponse = {
              user_id: user.user_id,
              token: token, // Send token to client
              last_login: user.last_login,
              created_at: user.created_at,
              premium: user.premium || false,
              daily_calories: user.daily_calories || null,
            };
          } else {
            console.log('Creating new user with ID:', userId);
            
            // Create a new user entry with premium field set to false
            // Don't store token in the database
            const newUser = {
              user_id: userId,
              created_at: new Date(),
              last_login: new Date(),
              premium: false
            };
            
            // Insert the new user into the database
            const result = await userCollection.insertOne(newUser);
            console.log('New user created with DB ID:', result.insertedId);
            
            // Create the user response with token included for client
            userResponse = {
              ...newUser,
              token: token, // Send token to client but it's not in newUser object
              _id: result.insertedId.toString()
            };
          }
        } else {
          console.log('No userCollection available, but generated ID:', userId);
          
          // Even without a database, we can still generate a JWT
          const token = jwt.sign(
            { 
              user_id: userId,
              is_demo: phoneNumber === DEMO_PHONE_NUMBER,
            }, 
            JWT_SECRET, 
            { expiresIn: phoneNumber === DEMO_PHONE_NUMBER ? DEMO_JWT_EXPIRES_IN : JWT_EXPIRES_IN }
          );
          
          // Create a minimal user response
          userResponse = {
            user_id: userId,
            token: token,
            premium: false,
            created_at: new Date(),
            last_login: new Date()
          };
        }
        
        // Return just the user data instead of the verification check
        res.status(200).json(userResponse);
      } else {
        // If verification failed, return the verification check object
        res.status(400).json({ 
          status: verificationCheck.status,
          error: 'Verification failed',
          message: 'The verification code is invalid or expired'
        });
      }
    } catch (error) {
      console.error('Error checking verification code:', error);
      res.status(500).json({
        error: error.message || 'Failed to check verification code'
      });
    }
  });

  // Get user information route
  router.get('/user', authenticateToken, async (req, res) => {
    try {
      // Extract user_id from the authenticated token
      const { user_id } = req.user;
      
      if (!user_id) {
        return res.status(400).json({ error: 'Invalid user token' });
      }

      // Look up user in the database
      if (userCollection) {
        const user = await userCollection.findOne({ user_id });
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Return user information, excluding sensitive data
        res.status(200).json({
          user_id: user.user_id,
          name: user.name || '',
          email: user.email || '',
          premium: user.premium || false,
          created_at: user.created_at,
          last_login: user.last_login,
          daily_calories: user.daily_calories || null,
          // Add any other non-sensitive user fields as needed
        });
      } else {
        // If no database connection, return error
        res.status(503).json({ error: 'Database service unavailable' });
      }
    } catch (error) {
      console.error('Error getting user information:', error);
      res.status(500).json({
        error: error.message || 'Failed to retrieve user information'
      });
    }
  });

  // Subscription verification endpoint
  router.post('/subscribe', authenticateToken, async (req, res) => {
    try {
      // Extract user_id from the authenticated token
      const { user_id } = req.user;
      
      if (!user_id) {
        return res.status(400).json({ error: 'Invalid user token' });
      }

      // Get receipt data from request body
      const { receipt, platform, timestamp } = req.body;
      
      if (!receipt || !platform) {
        return res.status(400).json({ 
          error: 'Receipt and platform are required' 
        });
      }
      console.log('DEBUG receipt: ', receipt);

      // Verify the receipt with the appropriate store
      let verificationResponse = {};

      // Verify receipt with appropriate store
      if (platform === 'ios') {
        verificationResponse = await verifyAppleReceipt(receipt);
      } else if (platform === 'android') {
        verificationResponse = await verifyGoogleReceipt(receipt);
      } else {
        return res.status(400).json({ error: 'Invalid platform specified' });
      }

      // If verification successful, update the user's premium status
      if (verificationResponse.isValid && userCollection) {
        // Look up the user first
        const user = await userCollection.findOne({ user_id });
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Update user premium status
        await userCollection.updateOne(
          { user_id },
          { 
            $set: { 
              premium: true,
              premium_updated_at: new Date(),
              subscription_receipts: [
                ...(subscription_receipts || []),
                {
                  platform,
                  timestamp,
                  validation_status: 'verified'
                }
              ].sort((a, b) => b.timestamp - a.timestamp)
            }
          }
        );

        // Get the updated user
        const updatedUser = await userCollection.findOne({ user_id });
        
        // Return updated user information
        res.status(200).json({
          user_id: updatedUser.user_id,
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          premium: updatedUser.premium,
          created_at: updatedUser.created_at,
          last_login: updatedUser.last_login,
          daily_calories: updatedUser.daily_calories || null,
          premium_updated_at: updatedUser.premium_updated_at,
          message: 'Premium status updated successfully'
        });
      } else if (!verificationResponse.isValid) {
        // If verification failed
        res.status(400).json({ 
          error: 'Receipt verification failed',
          message: 'The receipt provided is invalid or expired'
        });
      } else {
        // If no database connection
        res.status(503).json({ error: 'Database service unavailable' });
      }
    } catch (error) {
      console.error('Error verifying premium receipt:', error);
      res.status(500).json({
        error: error.message || 'Failed to verify receipt'
      });
    }
  });

  return router;
}

// Function to verify Apple App Store receipt
async function verifyAppleReceipt(receipt) {
  try {
    // In a real implementation, you would:
    // 1. First try verification against Apple's production server
    // 2. If that fails with specific errors, try sandbox server
    
    // For testing in development, you can simulate success:
    console.log('Apple receipt verification requested:', receipt.substring(0, 50) + '...');
    
    // For production, you would use actual Apple API:
    // const productionVerifyEndpoint = 'https://buy.itunes.apple.com/verifyReceipt';
    // const sandboxVerifyEndpoint = 'https://sandbox.itunes.apple.com/verifyReceipt';
    
    // const response = await fetch(productionVerifyEndpoint, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     'receipt-data': receipt,
    //     'password': process.env.APPLE_SHARED_SECRET,
    //     'exclude-old-transactions': true
    //   })
    // });
    // const data = await response.json();
    
    // Check the receipt status
    // Status 0 means success
    // return data.status === 0;
    
    // For this implementation, we'll simulate success
    return true;
  } catch (error) {
    console.error('Error verifying Apple receipt:', error);
    return false;
  }
}

// Function to verify Google Play Store receipt
async function verifyGoogleReceipt(receipt) {
  try {
    await jwtClient.authorize();
    const androidPublisher = google.androidpublisher({
      version: 'v3',
      auth: jwtClient
    });

    const purchase = await androidPublisher.purchases.products.get({
      packageName: receipt.packageName,
      productId: receipt.productId,
      token: receipt.purchaseToken
    });
    const isValid = purchase.data.purchaseState === 0;

    return {
      isValid,
      purchaseData: purchase.data,
      error: null
    }
  } catch (error) {
    console.error('Error verifying Google receipt:', error);
    return {
      isValid: false,
      purchaseData: null,
      error,
    }
  }
}

