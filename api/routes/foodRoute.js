import express from 'express';
import { ObjectId } from 'mongodb';

const router = express.Router();

export default function foodRoutes(foodCollection) {
  router.post('/food', async (req, res) => {
    try {
      const result = await foodCollection.insertOne(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create food item' });
    }
  });

  router.get('/food/:id', async (req, res) => {
    try {
      const foodItem = await foodCollection.findOne({ _id: new ObjectId(req.params.id) });
      if (!foodItem) {
        res.status(404).json({ error: 'Food item not found' });
        return;
      }
      res.json(foodItem);
    } catch (err) {
      res.status(500).json({ error: 'Failed to get food item' });
    }
  });

  router.delete('/food/:id', async (req, res) => {
    try {
      const result = await foodCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) {
        res.status(404).json({ error: 'Food item not found' });
        return;
      }
      res.json({ message: 'Food item deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete food item' });
    }
  });

  return router;
}
