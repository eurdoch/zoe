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

  return router;
}
