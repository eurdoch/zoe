import express from 'express';
const router = express.Router();
export default function weightRoutes(weightCollection) {
  router.post('/', async (req, res) => {
    try {
      console.log('POST /weight request received');
      const result = await weightCollection.insertOne(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create item' });
    }
  });
  router.delete('/:id', async (req, res) => {
    try {
      console.log(`DELETE /weight/${req.params.id} request received`);
      const result = await weightCollection.deleteOne({ _id: req.params.id });
      if (result.deletedCount === 0) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      res.json({ message: 'Item deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      console.log('GET /weight request received');
      const { startDate, endDate } = req.query;
      const query = {};
      if (startDate && endDate) {
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      const result = await weightCollection.find(query).toArray();
      if (result.length === 0) {
        const allResults = await weightCollection.find({}).toArray();
        res.json(allResults);
      } else {
        res.json(result);
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to get items' });
    }
  });

  router.put('/', async (req, res) => {
    try {
      console.log('PUT /weight request received');
      
      // Get user_id from the authentication middleware
      const userId = req.user ? req.user.user_id : null;
      console.log(`User ID from token: ${userId}`);
      
      // Extract _id from request body
      const { _id, ...updateData } = req.body;
      
      if (!_id) {
        return res.status(400).json({ error: 'Weight ID (_id) is required' });
      }
      
      // If we have user_id from authentication, ensure it's included in the update
      if (userId) {
        updateData.user_id = userId;
      }
      
      // Update the weight entry
      const result = await weightCollection.updateOne(
        { _id },
        { $set: updateData },
        { upsert: true }
      );
      
      if (result.matchedCount === 0 && result.upsertedCount === 0) {
        return res.status(404).json({ error: 'Weight entry not found and could not be created' });
      }
      
      // Fetch the updated/created document to return it
      const updatedWeight = await weightCollection.findOne({ _id });
      
      res.status(200).json(updatedWeight);
    } catch (err) {
      console.error('Error in PUT /weight:', err);
      res.status(500).json({ error: 'Failed to update weight entry' });
    }
  });

  return router;
}
