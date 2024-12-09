import express from 'express';
import { ObjectId } from 'mongodb';

const router = express.Router();

export default function foodRoutes(foodCollection) {
  router.post('/', async (req, res) => {
    try {
      const result = await foodCollection.insertOne(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const item = await foodCollection.findOne({ _id: new ObjectId(req.params.id) });
      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: 'Failed to get item' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const unixTime = parseInt(req.query.unixTime);
      const startOfDay = new Date(unixTime).setHours(0, 0, 0, 0);
      const endOfDay = new Date(unixTime).setHours(23, 59, 59, 999);
      const items = await foodCollection.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } }).toArray();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: 'Failed to get items' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const result = await foodCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  return router;
}
