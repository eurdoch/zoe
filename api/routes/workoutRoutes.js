import express from 'express';
const router = express.Router();
export default function workoutRoutes(workoutCollection) {
  router.post('/', async (req, res) => {
    try {
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`POST /workout for user: ${userId}`, req.body);
      
      // Add user_id to the workout data
      const workoutData = {
        ...req.body,
        user_id: userId
      };
      
      const result = await workoutCollection.insertOne(workoutData);
      res.status(201).json(result);
    } catch (err) {
      console.error('Error creating workout:', err);
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`GET /workout/${req.params.id} for user: ${userId}`);
      
      // Find workout by ID and ensure it belongs to the authenticated user
      const workout = await workoutCollection.findOne({ 
        _id: req.params.id,
        user_id: userId 
      });
      
      if (workout) {
        res.json(workout);
      } else {
        res.status(404).json({ error: 'Workout not found' });
      }
    } catch (err) {
      console.error('Error retrieving workout:', err);
      res.status(500).json({ error: 'Failed to retrieve workout' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`GET /workout for user: ${userId}`);
      
      // Filter workouts by user_id
      const workouts = await workoutCollection.find({ user_id: userId }).toArray();
      res.json(workouts);
    } catch (err) {
      console.error('Error retrieving workouts:', err);
      res.status(500).json({ error: 'Failed to retrieve workouts' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`DELETE /workout/${req.params.id} for user: ${userId}`);
      
      // Delete workout by ID and ensure it belongs to the authenticated user
      const result = await workoutCollection.deleteOne({ 
        _id: req.params.id,
        user_id: userId 
      });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Workout not found or not authorized' });
      }
      
      res.status(200).json(result);
    } catch (err) {
      console.error('Error deleting workout:', err);
      res.status(500).json({ error: 'Failed to delete workout' });
    }
  });

  router.put('/', async (req, res) => {
    try {
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`PUT /workout for user: ${userId}`);
      
      const { _id, ...updateData } = req.body;
      
      // First check if the workout belongs to this user
      const workout = await workoutCollection.findOne({ 
        _id: _id,
        user_id: userId
      });
      
      if (!workout) {
        return res.status(404).json({ error: 'Workout not found or not authorized' });
      }
      
      // Ensure we maintain the user_id in the update
      updateData.user_id = userId;
      
      // Update the workout
      const result = await workoutCollection.updateOne(
        { _id: _id, user_id: userId },
        { $set: updateData }
      );
      
      res.status(200).json(result);
    } catch (err) {
      console.error('Error updating workout:', err);
      res.status(500).json({ error: 'Failed to update workout' });
    }
  });

  return router;
}
