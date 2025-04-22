import express from 'express';
const router = express.Router();
export default function supplementRoutes(supplementCollection) {
  router.get('/names', async (req, res) => {
    try {
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`GET /supplement/names for user: ${userId}`);
      
      // Get distinct supplement names for this user
      const supplementNames = await supplementCollection.distinct('name', { user_id: userId });
      res.json(supplementNames);
    } catch (err) {
      console.error('GET /supplement/names error:', err);
      res.status(500).json({ error: `Error fetching supplement names: ${err}` });
    }
  });

  router.post('/', async (req, res) => {
    try {
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`POST /supplement for user: ${userId}`);
      
      // Add user_id to the supplement data
      const supplementData = {
        ...req.body,
        user_id: userId
      };
      
      const result = await supplementCollection.insertOne(supplementData);
      res.status(201).json(result);
    } catch (err) {
      console.error('POST /supplement error:', err);
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`DELETE /supplement/${req.params.id} for user: ${userId}`);
      
      // Only delete if both ID and user_id match
      const result = await supplementCollection.deleteOne({ 
        _id: req.params.id, 
        user_id: userId 
      });
      
      if (result.deletedCount === 0) {
        res.status(404).json({ error: 'Item not found or not authorized' });
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
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`GET /supplement for user: ${userId}`);
      
      const { startDate, endDate, last_logged } = req.query;
      console.log(`Query params - startDate: ${startDate}, endDate: ${endDate}, last_logged: ${last_logged}`);
      
      // Always include user_id in the query
      const query = { user_id: userId };
      
      if (startDate && endDate) {
        // Use createdAt field which is the timestamp field used in the client
        query.createdAt = { 
          $gte: parseInt(startDate, 10), 
          $lte: parseInt(endDate, 10) 
        };
        console.log(`Date filter added to query: ${JSON.stringify(query.createdAt)}`);
      }
      
      // Check if last_logged parameter exists
      if (last_logged) {
        // Parse last_logged as integer
        const limit = parseInt(last_logged, 10);
        
        if (isNaN(limit) || limit <= 0) {
          return res.status(400).json({ error: 'last_logged must be a positive integer' });
        }
        
        // Sort by createdAt descending and limit to requested number
        const result = await supplementCollection.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .toArray();
          
        return res.json(result);
      }
      
      // Original behavior when last_logged is not provided
      const result = await supplementCollection.find(query).toArray();
      console.log(`Found ${result.length} supplements matching query: ${JSON.stringify(query)}`);
      if (result.length > 0) {
        console.log(`Sample supplement: ${JSON.stringify(result[0])}`);
      }
      res.json(result);
    } catch (err) {
      console.error('GET /supplement error:', err);
      res.status(500).json({ error: 'Failed to get items' });
    }
  });

  router.put('/', async (req, res) => {
    try {
      // Get user_id from the authentication middleware
      const userId = req.user.user_id;
      console.log(`PUT /supplement request received for user: ${userId}`);
      
      // Extract _id from request body
      const { _id, ...updateData } = req.body;
      
      if (!_id) {
        return res.status(400).json({ error: 'Supplement ID (_id) is required' });
      }
      
      // Ensure user_id is preserved and matches the authenticated user
      updateData.user_id = userId;
      
      // First check if the supplement entry belongs to this user
      const supplementEntry = await supplementCollection.findOne({ 
        _id: _id,
        user_id: userId
      });
      
      let result;
      if (!supplementEntry) {
        // If entry doesn't exist yet, create it with this user_id
        result = await supplementCollection.updateOne(
          { _id },
          { $set: updateData },
          { upsert: true }
        );
      } else {
        // If entry exists, only update if it belongs to this user
        result = await supplementCollection.updateOne(
          { _id, user_id: userId },
          { $set: updateData }
        );
      }
      
      if (result.matchedCount === 0 && result.upsertedCount === 0) {
        return res.status(404).json({ error: 'Supplement entry not found and could not be created' });
      }
      
      // Fetch the updated/created document to return it
      const updatedSupplement = await supplementCollection.findOne({ _id, user_id: userId });
      
      res.status(200).json(updatedSupplement);
    } catch (err) {
      console.error('Error in PUT /supplement:', err);
      res.status(500).json({ error: 'Failed to update supplement entry' });
    }
  });

  return router;
}
