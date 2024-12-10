import express from 'express';
import { ObjectId } from 'mongodb';
const router = express.Router();
export default function workoutRoutes(workoutCollection) {
  router.post('/', async (req, res) => {
    try {
      const result = await workoutCollection.insertOne(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create item' });
    }
  });
  router.get('/:id', async (req, res) => {
    try {
      const workout = await workoutCollection.findOne({ _id: new ObjectId(req.params.id) });
      if (workout) {
        res.json(workout);
      } else {
        res.status(404).json({ error: 'Workout not found' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve workout' });
    }
  });
  router.get('/', async (req, res) => {
    try {
      const workouts = await workoutCollection.find({}).toArray();
      res.json(workouts);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve workouts' });
    }
  });
  router.delete('/:id', async (req, res) => {
    try {
      const result = await workoutCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete workout' });
    }
  });
  router.put('/', async (req, res) => {
    try {
      const result = await workoutCollection.updateOne(
        { _id: new ObjectId(req.body._id) },
        { $set: req.body }
      );
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update workout' });
    }
  });
  return router;
}
