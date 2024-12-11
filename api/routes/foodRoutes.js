import express from 'express';
import { ObjectId } from 'mongodb';
const router = express.Router();
export default function foodRoutes(foodCollection) {
  router.post('/', async (req, res) => {
    try {
      console.log('food POST /', req.body);
      const result = await foodCollection.insertOne(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error('POST / error', err);
      res.status(500).json({ error: 'Failed to create item' });
    }
  });
  router.get('/:id', async (req, res) => {
    try {
      const item = await foodCollection.findOne({ _id: new ObjectId(req.params.id) });
      if (!item) {
        console.log('food GET /:id not found', req.params.id);
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      console.log('food GET /:id', item);
      res.json(item);
    } catch (err) {
      console.error('GET /:id error', err);
      res.status(500).json({ error: 'Failed to get item' });
    }
  });
  router.get('/', async (req, res) => {
    try {
      const unixTime = parseInt(req.query.unixTime);
      const startOfDay = new Date(unixTime).setHours(0, 0, 0, 0);
      const endOfDay = new Date(unixTime).setHours(23, 59, 59, 999);
      const items = await foodCollection.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } }).toArray();
      console.log('food GET /', items.length, 'items');
      res.json(items);
    } catch (err) {
      console.error('GET / error', err);
      res.status(500).json({ error: 'Failed to get items' });
    }
  });
  router.delete('/:id', async (req, res) => {
    try {
      const result = await foodCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) {
        console.log('food DELETE /:id not found', req.params.id);
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      console.log('food DELETE /:id', result);
      res.json(result);
    } catch (err) {
      console.error('DELETE /:id error', err);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });
  return router;
}
