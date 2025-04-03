import express from 'express';
const router = express.Router();
export default function supplementRoutes(supplementCollection) {
  router.get('/names', async (req, res) => {
    try {
      console.log('GET /supplement/names');
      const supplementNames = await supplementCollection.distinct('name');
      res.json(supplementNames);
    } catch (err) {
      console.error('GET /supplement/names error:', err);
      res.status(500).json({ error: `Error fetching exercise names: ${err}` });
    }
  });

  router.post('/', async (req, res) => {
    try {
      console.log('POST /supplement', req.body);
      const result = await supplementCollection.insertOne(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error('POST /supplement error:', err);
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      console.log('DELETE /supplement/:id');
      const result = await supplementCollection.deleteOne({ _id: req.params.id });
      if (result.deletedCount === 0) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      res.json({ message: 'Item deleted successfully' });
    } catch (err) {
      console.error('DELETE /supplement/:id error:', err);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      console.log('GET /supplement');
      const { startDate, endDate } = req.query;
      const query = {};
      if (startDate && endDate) {
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      const result = await supplementCollection.find(query).toArray();
      if (result.length === 0) {
        const allResults = await supplementCollection.find({}).toArray();
        res.json(allResults);
      } else {
        res.json(result);
      }
    } catch (err) {
      console.error('GET /supplement error:', err);
      res.status(500).json({ error: 'Failed to get items' });
    }
  });

  router.put('/', async (req, res) => {
    try {
      console.log('PUT /supplement request received');
      
      // Get user_id from the authentication middleware
      const userId = req.user ? req.user.user_id : null;
      console.log(`User ID from token: ${userId}`);
      
      // Extract _id from request body
      const { _id, ...updateData } = req.body;
      
      if (!_id) {
        return res.status(400).json({ error: 'Supplement ID (_id) is required' });
      }
      
      // If we have user_id from authentication, ensure it's included in the update
      if (userId) {
        updateData.user_id = userId;
      }
      
      // Update the supplement entry
      const result = await supplementCollection.updateOne(
        { _id },
        { $set: updateData },
        { upsert: true }
      );
      
      if (result.matchedCount === 0 && result.upsertedCount === 0) {
        return res.status(404).json({ error: 'Supplement entry not found and could not be created' });
      }
      
      // Fetch the updated/created document to return it
      const updatedSupplement = await supplementCollection.findOne({ _id });
      
      res.status(200).json(updatedSupplement);
    } catch (err) {
      console.error('Error in PUT /supplement:', err);
      res.status(500).json({ error: 'Failed to update supplement entry' });
    }
  });

  return router;
}
