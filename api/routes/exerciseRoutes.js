import express from 'express';
import { ObjectId } from 'mongodb';

const router = express.Router();

export default function exerciseRoutes(exerciseCollection) {
  router.get('/names', async (req, res) => {
    try {
      const exerciseNames = await exerciseCollection.distinct('name');
      res.json(exerciseNames);
    } catch (err) {
      res.status(500).json({ error: `Error fetching exercise names: ${err}` });
    }
  });

  router.get('/', async (req, res) => {
    const name = req.query.name;
    const id = req.query.id;
    const query = name ? { name } : id ? { _id: new ObjectId(id) } : {};
    try {
      const exercise = await exerciseCollection.findOne(query);
      res.json(exercise);
    } catch (err) {
      res.status(500).json({ error: `Error fetching exercises: ${err}` });
    }
  });

  router.get('/:name', async (req, res) => {
    const name = req.params.name;
    try {
      const exercises = await exerciseCollection.find({ name }).toArray();
      res.json(exercises);
    } catch (err) {
      res.status(500).json({ error: `Error fetching exercises: ${err}` });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const result = await exerciseCollection.insertOne(req.body);
      const insertedExercise = await exerciseCollection.findOne({ _id: result.insertedId });
      res.status(201).json(insertedExercise);
    } catch (err) {
      res.status(500).json({ error: `Error saving exercise data: ${err}` });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const result = await exerciseCollection.deleteOne(query);
      res.json({ deletedCount: result.deletedCount });
    } catch (err) {
      res.status(500).json({ error: `Error deleting exercises: ${err}` });
    }
  });

  return router;
}
 
