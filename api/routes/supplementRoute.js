import express from 'express';
import { ObjectId } from 'mongodb';
const router = express.Router();
export default function supplementRoutes(supplementCollection) {
  router.get('/supplement/names', async (req, res) => {
    try {
      console.log('/supplement/names GET request received');
      const supplementNames = await supplementCollection.distinct('name');
      res.json(supplementNames);
    } catch (err) {
      console.error('/supplement/names GET request error:', err);
      res.status(500).json({ error: `Error fetching exercise names: ${err}` });
    }
  });
  router.post('/supplement', async (req, res) => {
    try {
      console.log('/supplement POST request received');
      const result = await supplementCollection.insertOne(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error('/supplement POST request error:', err);
      res.status(500).json({ error: 'Failed to create item' });
    }
  });
  router.delete('/supplement/:id', async (req, res) => {
    try {
      console.log('/supplement DELETE request received');
      const result = await supplementCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      if (result.deletedCount === 0) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      res.json({ message: 'Item deleted successfully' });
    } catch (err) {
      console.error('/supplement DELETE request error:', err);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });
  router.get('/supplement', async (req, res) => {
    try {
      console.log('/supplement GET request received');
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
      console.error('/supplement GET request error:', err);
      res.status(500).json({ error: 'Failed to get items' });
    }
  });
  return router;
}
