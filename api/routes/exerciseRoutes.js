import express from 'express';
const router = express.Router();
export default function exerciseRoutes(exerciseCollection) {
  router.get('/names', async (req, res) => {
    try {
      console.log('GET /exercise/names');
      const exerciseNames = await exerciseCollection.distinct('name');
      res.json(exerciseNames);
    } catch (err) {
      console.error(`Error fetching exercise names: ${err}`);
      res.status(500).json({ error: `Error fetching exercise names: ${err}` });
    }
  });

router.get('/', async (req, res) => {
  const name = req.query.name;
  const id = req.query.id;
  const query = name ? { name } : id ? { _id: id } : {};
  try {
    if (Object.keys(query).length === 0) {
      console.log('GET /exercise - fetching all exercises');
      const exercises = await exerciseCollection.find({}).toArray();
      res.json(exercises);
    } else {
      console.log(`GET /exercise?${new URLSearchParams(req.query)}`);
      const exercise = await exerciseCollection.findOne(query);
      res.json(exercise);
    }
  } catch (err) {
    console.error(`Error fetching exercises: ${err}`);
    res.status(500).json({ error: `Error fetching exercises: ${err}` });
  }
});

  router.get('/:name', async (req, res) => {
    const name = req.params.name;
    try {
      console.log(`GET /exercise/${name}`);
      const exercises = await exerciseCollection.find({ name }).toArray();
      res.json(exercises);
    } catch (err) {
      console.error(`Error fetching exercises: ${err}`);
      res.status(500).json({ error: `Error fetching exercises: ${err}` });
    }
  });
  router.post('/', async (req, res) => {
    try {
      console.log('POST /exercise');
      const result = await exerciseCollection.insertOne(req.body);
      const insertedExercise = await exerciseCollection.findOne({ _id: result.insertedId });
      res.status(201).json(insertedExercise);
    } catch (err) {
      console.error(`Error saving exercise data: ${err}`);
      res.status(500).json({ error: `Error saving exercise data: ${err}` });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`DELETE /exercise/${req.params.id}`);
      const query = { _id: id };
      const result = await exerciseCollection.deleteOne(query);
      res.json({ deletedCount: result.deletedCount });
    } catch (err) {
      console.error(`Error deleting exercises: ${err}`);
      res.status(500).json({ error: `Error deleting exercises: ${err}` });
    }
  });

  return router;
}
