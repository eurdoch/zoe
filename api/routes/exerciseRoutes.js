import express from 'express';
const router = express.Router();
export default function exerciseRoutes(exerciseCollection) {
  router.get('/names', async (req, res) => {
    try {
      // Get user_id from the authenticated request
      const userId = req.user.user_id;
      console.log(`GET /exercise/names for user: ${userId}`);
      
      // Get distinct exercise names for this user
      const exerciseNames = await exerciseCollection.distinct('name', { user_id: userId });
      res.json(exerciseNames);
    } catch (err) {
      console.error(`Error fetching exercise names: ${err}`);
      res.status(500).json({ error: `Error fetching exercise names: ${err}` });
    }
  });

  router.get('/', async (req, res) => {
    // Get user_id from the authenticated request
    const userId = req.user.user_id;
    const name = req.query.name;
    const id = req.query.id;
    
    // Always include user_id in queries
    const baseQuery = { user_id: userId };
    const query = name ? { ...baseQuery, name } : id ? { ...baseQuery, _id: id } : baseQuery;
    
    try {
      if (!name) {
        console.log(`GET /exercise - fetching exercise with id ${id} for user: ${userId}`);
        const exercises = await exerciseCollection.findOne(query);
        res.json(exercises);
      } else {
        console.log(`GET /exercise?${new URLSearchParams(req.query)} for user: ${userId}`);
        const exercises = await exerciseCollection.find(query).toArray();
        res.json(exercises);
      }
    } catch (err) {
      console.error(`Error fetching exercises: ${err}`);
      res.status(500).json({ error: `Error fetching exercises: ${err}` });
    }
  });

  router.get('/:name', async (req, res) => {
    // Get user_id from the authenticated request
    const userId = req.user.user_id;
    const name = req.params.name;
    
    try {
      console.log(`GET /exercise/${name} for user: ${userId}`);
      const exercises = await exerciseCollection.find({ name, user_id: userId }).toArray();
      res.json(exercises);
    } catch (err) {
      console.error(`Error fetching exercises: ${err}`);
      res.status(500).json({ error: `Error fetching exercises: ${err}` });
    }
  });
  
  router.post('/', async (req, res) => {
    try {
      // Get user_id from the authenticated request
      const userId = req.user.user_id;
      console.log(`POST /exercise for user: ${userId}`);
      
      // Add user_id to the exercise data
      const exerciseWithUserId = {
        ...req.body,
        user_id: userId
      };
      
      const result = await exerciseCollection.insertOne(exerciseWithUserId);
      const insertedExercise = await exerciseCollection.findOne({ _id: result.insertedId });
      res.status(201).json(insertedExercise);
    } catch (err) {
      console.error(`Error saving exercise data: ${err}`);
      res.status(500).json({ error: `Error saving exercise data: ${err}` });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      // Get user_id from the authenticated request
      const userId = req.user.user_id;
      const id = req.params.id;
      
      console.log(`DELETE /exercise/${id} for user: ${userId}`);
      
      // Only delete if both ID and user_id match
      const query = { _id: id, user_id: userId };
      const result = await exerciseCollection.deleteOne(query);
      
      res.json({ deletedCount: result.deletedCount });
    } catch (err) {
      console.error(`Error deleting exercises: ${err}`);
      res.status(500).json({ error: `Error deleting exercises: ${err}` });
    }
  });

  router.put('/', async (req, res) => {
    try {
      // Get user_id from the authenticated request
      const userId = req.user.user_id;
      const { _id, ...updateData } = req.body;
      
      console.log(`PUT /exercise - Updating exercise with id: ${_id} for user: ${userId}`);
      
      if (!_id) {
        return res.status(400).json({ error: 'Exercise ID (_id) is required' });
      }

      // Make sure user_id is preserved and matches the authenticated user
      updateData.user_id = userId;
      
      const result = await exerciseCollection.updateOne(
        { _id, user_id: userId }, // Only update if both ID and user_id match
        { $set: updateData },
        { upsert: true }
      );

      const updatedExercise = await exerciseCollection.findOne({ _id, user_id: userId });
      res.json(updatedExercise);
    } catch (err) {
      console.error(`Error updating exercise: ${err}`);
      res.status(500).json({ error: `Error updating exercise: ${err}` });
    }
  });

  return router;
}
