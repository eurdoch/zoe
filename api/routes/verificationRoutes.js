import express from 'express';
import jwt from 'jsonwebtoken';
import authenticateToken from '../middleware/auth.js';
import { SESClient, SendEmailCommand, SendTemplatedEmailCommand } from "@aws-sdk/client-ses";
import crypto from 'crypto';

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

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// SES Configuration
const SES_SENDER_EMAIL = process.env.SES_SENDER_EMAIL || 'noreply@zotik.com';

// JWT secret - in production, store in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'zoe-app-jwt-secret-key-development-only';
const JWT_EXPIRES_IN = '90d'; // 3 months
const DEMO_JWT_EXPIRES_IN = '2h'; // 10 minutes for demo account
const DEMO_EMAIL = process.env.DEMO_EMAIL;

// Store verification codes temporarily
const verificationCodes = new Map();
const VERIFICATION_CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes

// Email hash function - must match client-side implementation exactly
const generateConsistentHash = (email) => {
  // Normalize the email by converting to lowercase
  const normalizedEmail = email.toLowerCase();
  
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
    const segmentInput = normalizedEmail + i.toString();
    hashParts.push(hashSegment(segmentInput, i));
  }
  
  // Join all segments to create a fixed-length hash
  const fullHash = hashParts.join('');
  
  return fullHash;
};

// Generate a verification code
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const router = express.Router();

export default function verificationRoutes(userCollection) {

  // Send verification email
  router.post('/send', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // For demo account, skip actual verification
    if (email === DEMO_EMAIL) {
      console.log('Demo account detected, skipping email verification send');
      // Return a mock verification object
      return res.status(200).json({
        status: 'pending',
        to: email,
        channel: 'email',
        date_created: new Date().toISOString(),
        valid: true
      });
    }

    try {
      // Generate a verification code
      const verificationCode = generateVerificationCode();
      
      // Store the code with expiry time
      verificationCodes.set(email, {
        code: verificationCode,
        expires: Date.now() + VERIFICATION_CODE_EXPIRY
      });
      
      // Prepare the email
      const sendEmailCommand = new SendEmailCommand({
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: `
                <html>
                  <body>
                    <h1>Kaloos Verification Code</h1>
                    <p>Your verification code is: <strong>${verificationCode}</strong></p>
                    <p>This code will expire in 10 minutes.</p>
                  </body>
                </html>
              `,
            },
            Text: {
              Charset: "UTF-8",
              Data: `Your Kaloos verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: "Kaloos Verification Code",
          },
        },
        Source: SES_SENDER_EMAIL,
      });
      
      // Send the email
      await sesClient.send(sendEmailCommand);
      
      // Return success response
      res.status(200).json({
        status: 'pending',
        to: email,
        channel: 'email',
        date_created: new Date().toISOString(),
        valid: true
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      res.status(500).json({
        error: error.message || 'Failed to send verification code'
      });
    }
  });

  // Check verification code
  router.post('/check', async (req, res) => {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ 
        error: 'Email and verification code are required' 
      });
    }

    try {
      let verificationStatus = 'pending';
      
      // Check if this is the demo account
      if (email === DEMO_EMAIL) {
        // Skip verification for demo account
        console.log('Demo account detected, bypassing verification');
        verificationStatus = 'approved';
      } else {
        // Verify the code
        const storedVerification = verificationCodes.get(email);
        
        if (storedVerification && 
            storedVerification.code === code && 
            storedVerification.expires > Date.now()) {
          verificationStatus = 'approved';
          // Delete the used code
          verificationCodes.delete(email);
        } else {
          verificationStatus = 'failed';
        }
      }

      // If verification is successful, hash the email and return user data
      if (verificationStatus === 'approved') {
        // Generate user ID from email
        const userId = generateConsistentHash(email);
        console.log('Generated user ID from email:', userId);
        
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
            }, 
            JWT_SECRET, 
            { expiresIn: email === DEMO_EMAIL ? DEMO_JWT_EXPIRES_IN : JWT_EXPIRES_IN }
          );
          
          if (user) {
            console.log('User found:', user._id);
            
            // Update only last login time, don't store the token
            await userCollection.updateOne(
              { user_id: userId },
              { 
                $set: { 
                  last_login: new Date(),
                  email: email // Store or update the email
                }
              }
            );
            
            // Get the updated user data
            user = await userCollection.findOne({ user_id: userId });
            
            // Create the user response with token but don't store it in DB
            userResponse = {
              user_id: user.user_id,
              email: user.email,
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
              email: email,
              created_at: new Date(),
              last_login: new Date(),
              premium: false,
              premium_updated_at: '',
              subscription_receipts: [],
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
              email: email,
              is_demo: email === DEMO_EMAIL,
            }, 
            JWT_SECRET, 
            { expiresIn: email === DEMO_EMAIL ? DEMO_JWT_EXPIRES_IN : JWT_EXPIRES_IN }
          );
          
          // Create a minimal user response
          userResponse = {
            user_id: userId,
            email: email,
            token: token,
            premium: false,
            created_at: new Date(),
            last_login: new Date()
          };
        }
        
        // Return just the user data instead of the verification check
        res.status(200).json(userResponse);
      } else {
        // If verification failed
        res.status(400).json({ 
          status: verificationStatus,
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
            },
            $push: {  
              subscription_receipts: {
                platform,
                timestamp,
                purchaseData: verificationResponse.purchaseData,
                receiptData: verificationResponse.receiptData,
                validation_status: 'verified'
              }
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
    return {
      isValid: true,
      purchaseData: { productId: 'com.zotik.premium', expiryDate: new Date(Date.now() + 31536000000).toISOString() },
      receiptData: receipt
    };
  } catch (error) {
    console.error('Error verifying Apple receipt:', error);
    return {
      isValid: false,
      purchaseData: null,
      receiptData: receipt,
      error
    };
  }
}

// Function to verify Google Play Store receipt
async function verifyGoogleReceipt(receipt) {
  try {
    console.log('Google receipt verification requested, receipt type:', typeof receipt);
    
    // Parse the receipt if it's a string
    let receiptData;
    if (typeof receipt === 'string') {
      try {
        receiptData = JSON.parse(receipt);
        console.log('Successfully parsed receipt string to JSON');
      } catch (parseError) {
        console.error('Failed to parse receipt string:', parseError);
        // If can't parse as JSON, it might be a direct purchase token
        receiptData = {
          packageName: process.env.ANDROID_PACKAGE_NAME || 'com.zotik',
          productId: process.env.ANDROID_PRODUCT_ID || 'kallos_premium',
          purchaseToken: receipt
        };
        console.log('Using receipt string as purchase token with default package/product');
      }
    } else {
      receiptData = receipt;
    }
    
    console.log('Receipt data for verification:', receiptData);
    
    // Check if we have all required parameters
    if (!receiptData.packageName || !receiptData.productId || !receiptData.purchaseToken) {
      console.error('Missing required receipt parameters:', {
        hasPackageName: !!receiptData.packageName,
        hasProductId: !!receiptData.productId,
        hasPurchaseToken: !!receiptData.purchaseToken
      });
      
      return {
        isValid: false,
        purchaseData: null,
        error: new Error('Missing required receipt parameters')
      };
    }
    
    // Authorize and verify
    await jwtClient.authorize();
    const androidPublisher = google.androidpublisher({
      version: 'v3',
      auth: jwtClient
    });

    const purchase = await androidPublisher.purchases.subscriptions.get({
      packageName: receiptData.packageName,
      subscriptionId: receiptData.productId,
      token: receiptData.purchaseToken
    });
    const isValid = purchase.data.paymentState === 1 && 
      !purchase.data.cancelReason &&
      new Date(parseInt(purchase.data.expiryTimeMillis)) > new Date();

    return {
      isValid,
      purchaseData: purchase.data,
      receiptData,
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
