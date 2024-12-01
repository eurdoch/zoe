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

  router.delete('/:id', async (req, res) => {
    try {
      const result = await foodCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      res.json({ message: 'Item deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  return router;
}
