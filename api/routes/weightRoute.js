import express from 'express';
import { ObjectId } from 'mongodb';
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
      const result = await weightCollection.deleteOne({ _id: new ObjectId(req.params.id) });
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
  return router;
}
