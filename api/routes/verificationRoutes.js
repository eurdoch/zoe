import express from 'express';
import twilio from 'twilio';

// Initialize Twilio client at module level
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

// Create a single client instance to be reused
const client = twilio(accountSid, authToken);

const router = express.Router();

export default function verificationRoutes() {

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
      
      res.status(200).json({
        success: true,
        status: verification.status,
        message: 'Verification code sent successfully'
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      res.status(500).json({
        success: false,
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
      const verificationCheck = await client.verify.v2
        .services(serviceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code: code
        });

      if (verificationCheck.status === 'approved') {
        // Here you would typically:
        // 1. Create a user or find existing user by phone number
        // 2. Generate authentication tokens
        // 3. Return user data and tokens
        
        res.status(200).json({
          success: true,
          status: verificationCheck.status,
          message: 'Verification successful',
          // Include any additional user data or tokens here
          user: {
            phoneNumber: phoneNumber,
            // Add other user properties as needed
          }
        });
      } else {
        res.status(400).json({
          success: false,
          status: verificationCheck.status,
          message: 'Verification failed'
        });
      }
    } catch (error) {
      console.error('Error checking verification code:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to check verification code'
      });
    }
  });

  return router;
}
