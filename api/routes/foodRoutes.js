import express from 'express';
import { ObjectId } from 'mongodb';

const router = express.Router();

export default function foodRoutes(foodCollection) {

  router.post('/', async (req, res) => {
    try {
      // Get user_id from the authenticated request
      const userId = req.user.user_id;
      console.log(`POST /food for user: ${userId}`);
      
      // Add user_id to the food data
      const foodWithUserId = {
        ...req.body,
        user_id: userId
      };
      
      const result = await foodCollection.insertOne(foodWithUserId);
      res.status(201).json(result);
    } catch (err) {
      console.error('POST /food error', err);
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      // Get user_id from the authenticated request
      const userId = req.user.user_id;
      console.log(`GET /food/${req.params.id} for user: ${userId}`);
      
      // Find food item by ID and user_id
      const item = await foodCollection.findOne({ 
        _id: new ObjectId(req.params.id),
        user_id: userId 
      });
      
      if (!item) {
        console.log('GET /food/:id not found', req.params.id);
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      
      res.json(item);
    } catch (err) {
      console.error('GET /food/:id error', err);
      res.status(500).json({ error: 'Failed to get item' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      // Get user_id from the authenticated request
      const userId = req.user.user_id;
      
      const unixTime = parseInt(req.query.unixTime);
      const startOfDay = new Date(unixTime * 1000).setHours(0, 0, 0, 0) / 1000;
      const endOfDay = new Date(unixTime * 1000).setHours(23, 59, 59, 999) / 1000;
      
      console.log(`GET /food for user: ${userId}, date: ${new Date(unixTime * 1000).toDateString()}`);

      // Find food items by date range and user_id
      const items = await foodCollection.find({ 
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        user_id: userId
      }).toArray();
      
      console.log(`Found ${items.length} food items for user: ${userId}`);
      res.json(items);
    } catch (err) {
      console.error('GET /food error', err);
      res.status(500).json({ error: 'Failed to get items' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      // Get user_id from the authenticated request
      const userId = req.user.user_id;
      console.log(`DELETE /food/${req.params.id} for user: ${userId}`);
      
      // Delete food item by ID and user_id
      const result = await foodCollection.deleteOne({ 
        _id: new ObjectId(req.params.id),
        user_id: userId
      });
      
      if (result.deletedCount === 0) {
        console.log('DELETE /food/:id not found or unauthorized', req.params.id);
        res.status(404).json({ error: 'Item not found or you are not authorized to delete it' });
        return;
      }
      
      res.json(result);
    } catch (err) {
      console.error('DELETE /food/:id error', err);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  return router;
}
