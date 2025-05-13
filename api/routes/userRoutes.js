import express from 'express';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

export default function userRoutes(userCollection) {
  // Update user information route
  router.put('/', authenticateToken, async (req, res) => {
    try {
      // Extract user_id from the authenticated token
      const { user_id } = req.user;
      
      if (!user_id) {
        return res.status(400).json({ error: 'Invalid user token' });
      }

      // Get update data from request body
      const updateData = req.body;
      
      // Define which fields are allowed to be updated
      const allowedFields = ['name', 'email', 'daily_calories'];
      
      // Filter out any fields that are not allowed to be updated
      const sanitizedUpdate = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          // For daily_calories, ensure it's a valid number
          if (field === 'daily_calories') {
            const calories = parseInt(updateData[field], 10);
            if (isNaN(calories) || calories < 0) {
              return res.status(400).json({
                error: 'Invalid daily calorie value. Must be a positive number.'
              });
            }
            sanitizedUpdate[field] = calories;
          } else {
            sanitizedUpdate[field] = updateData[field];
          }
        }
      }
      
      // If no valid fields to update
      if (Object.keys(sanitizedUpdate).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update provided',
          message: `Allowed fields for update: ${allowedFields.join(', ')}`
        });
      }

      // Look up user in the database and update
      if (userCollection) {
        // Add last_updated timestamp
        sanitizedUpdate.last_updated = new Date();
        
        // Update the user document
        const result = await userCollection.updateOne(
          { user_id },
          { $set: sanitizedUpdate }
        );
        
        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Get the updated user
        const updatedUser = await userCollection.findOne({ user_id });
        
        // Return updated user information
        res.status(200).json({
          user_id: updatedUser.user_id,
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          premium: updatedUser.premium || false,
          created_at: updatedUser.created_at,
          last_login: updatedUser.last_login,
          daily_calories: updatedUser.daily_calories || null,
          message: 'User information updated successfully'
        });
      } else {
        // If no database connection, return error
        res.status(503).json({ error: 'Database service unavailable' });
      }
    } catch (error) {
      console.error('Error updating user information:', error);
      res.status(500).json({
        error: error.message || 'Failed to update user information'
      });
    }
  });

  return router;
}
