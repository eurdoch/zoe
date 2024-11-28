import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
const port = 3000;

app.use(express.json());

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    const database = client.db('vitale');
    const exerciseCollection = database.collection('exercises');

    app.get('/', (req, res) => {
      res.send('Ping a da pong');
    });

    app.get('/exercise/names', async (req, res) => {
      try {
        const exerciseNames = await exerciseCollection.distinct('name');
        res.json(exerciseNames);
      } catch (err) {
        res.status(500).json({ error: `Error fetching exercise names: ${err}` });
      }
    });

    app.get('/exercise', async (req, res) => {
      const name = req.query.name;
      const query = name ? { name } : {};
      try {
        const exercises = await exerciseCollection.find(query).toArray();
        res.json(exercises);
      } catch (err) {
        res.status(500).json({ error: `Error fetching exercises: ${err}` });
      }
    });

    app.get('/exercise/:name', async (req, res) => {
      const name = req.params.name;
      try {
        const exercises = await exerciseCollection.find({ name }).toArray();
        res.json(exercises);
      } catch (err) {
        res.status(500).json({ error: `Error fetching exercises: ${err}` });
      }
    });

    app.post('/exercise', async (req, res) => {
      try {
        const result = await exerciseCollection.insertOne(req.body);
        const insertedExercise = await exerciseCollection.findOne({ _id: result.insertedId });
        res.status(201).json(insertedExercise);
      } catch (err) {
        res.status(500).json({ error: `Error saving exercise data: ${err}` });
      }
    });

    app.delete('/exercise/:id', async (req, res) => {
      try {
        const id = new ObjectId(req.params.id);
        const query = { _id: id };
        const result = await exerciseCollection.deleteOne(query);
        res.json({ deletedCount: result.deletedCount });
      } catch (err) {
        res.status(500).json({ error: `Error deleting exercises: ${err}` });
      }
    });

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

connectToDatabase()
