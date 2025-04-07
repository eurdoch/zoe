import express from 'express';
const router = express.Router();
export default function weightRoutes(weightCollection) {
  router.post('/', async (req, res) => {
    try {
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`POST /weight request received for user: ${userId}`);
      
      // Add user_id to the weight data
      const weightData = {
        ...req.body,
        user_id: userId
      };
      
      const result = await weightCollection.insertOne(weightData);
      res.status(201).json(result);
    } catch (err) {
      console.error('Error creating weight entry:', err);
      res.status(500).json({ error: 'Failed to create item' });
    }
  });
  
  router.delete('/:id', async (req, res) => {
    try {
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`DELETE /weight/${req.params.id} request received for user: ${userId}`);
      
      // Only delete if both ID and user_id match
      const result = await weightCollection.deleteOne({ 
        _id: req.params.id,
        user_id: userId
      });
      
      if (result.deletedCount === 0) {
        res.status(404).json({ error: 'Item not found or not authorized' });
        return;
      }
      
      res.json({ message: 'Item deleted successfully' });
    } catch (err) {
      console.error('Error deleting weight entry:', err);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`GET /weight request received for user: ${userId}`);
      
      const { startDate, endDate } = req.query;
      // Always include user_id in the query
      const query = { user_id: userId };
      
      if (startDate && endDate) {
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      const result = await weightCollection.find(query).toArray();
      res.json(result);
    } catch (err) {
      console.error('Error retrieving weight entries:', err);
      res.status(500).json({ error: 'Failed to get items' });
    }
  });

  router.put('/', async (req, res) => {
    try {
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`PUT /weight request received for user: ${userId}`);
      
      // Extract _id from request body
      const { _id, ...updateData } = req.body;
      
      if (!_id) {
        return res.status(400).json({ error: 'Weight ID (_id) is required' });
      }
      
      // Ensure user_id is preserved and matches the authenticated user
      updateData.user_id = userId;
      
      // First check if the weight entry belongs to this user
      const weightEntry = await weightCollection.findOne({ 
        _id: _id,
        user_id: userId
      });
      
      let result;
      if (!weightEntry) {
        // If entry doesn't exist yet, create it with this user_id
        result = await weightCollection.updateOne(
          { _id },
          { $set: updateData },
          { upsert: true }
        );
      } else {
        // If entry exists, only update if it belongs to this user
        result = await weightCollection.updateOne(
          { _id, user_id: userId },
          { $set: updateData }
        );
      }
      
      if (result.matchedCount === 0 && result.upsertedCount === 0) {
        return res.status(404).json({ error: 'Weight entry not found and could not be created' });
      }
      
      // Fetch the updated/created document to return it
      const updatedWeight = await weightCollection.findOne({ _id, user_id: userId });
      
      res.status(200).json(updatedWeight);
    } catch (err) {
      console.error('Error in PUT /weight:', err);
      res.status(500).json({ error: 'Failed to update weight entry' });
    }
  });

  return router;
}
