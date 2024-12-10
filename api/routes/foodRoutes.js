import express from 'express';
import { ObjectId } from 'mongodb';
const router = express.Router();
export default function foodRoutes(foodCollection) {
  router.post('/food', async (req, res) => {
    try {
      console.log('POST /food', req.body);
      const result = await foodCollection.insertOne(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error('POST /food error', err);
      res.status(500).json({ error: 'Failed to create item' });
    }
  });
  router.get('/food/:id', async (req, res) => {
    try {
      const item = await foodCollection.findOne({ _id: new ObjectId(req.params.id) });
      if (!item) {
        console.log('GET /food/:id not found', req.params.id);
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      console.log('GET /food/:id', item);
      res.json(item);
    } catch (err) {
      console.error('GET /food/:id error', err);
      res.status(500).json({ error: 'Failed to get item' });
    }
  });
  router.get('/food', async (req, res) => {
    try {
      const unixTime = parseInt(req.query.unixTime);
      const startOfDay = new Date(unixTime).setHours(0, 0, 0, 0);
      const endOfDay = new Date(unixTime).setHours(23, 59, 59, 999);
      const items = await foodCollection.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } }).toArray();
      console.log('GET /food', items.length, 'items');
      res.json(items);
    } catch (err) {
      console.error('GET /food error', err);
      res.status(500).json({ error: 'Failed to get items' });
    }
  });
  router.delete('/food/:id', async (req, res) => {
    try {
      const result = await foodCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) {
        console.log('DELETE /food/:id not found', req.params.id);
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      console.log('DELETE /food/:id', result);
      res.json(result);
    } catch (err) {
      console.error('DELETE /food/:id error', err);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });
  return router;
}
