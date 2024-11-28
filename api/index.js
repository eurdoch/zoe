import express from 'express';
import { MongoClient } from 'mongodb';

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
        res.json(exerciseNames.sort());
      } catch (err) {
        res.status(500).json({ error: `Error fetching exercise names: ${err}` });
      }
    });


    app.get('/exercise', async (req, res) => {
      const name = req.query.name;
      const query = name ? { name } : {};
      try {
        const exercises = await exerciseCollection.find(query).toArray();
        console.log(exercises);
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
      console.log('exercise');
      const { name, reps, weight } = req.body;
      console.log(name, reps, weight);
      const exercise = { name, reps, weight, createdAt: new Date() };
      try {
        const result = await exerciseCollection.insertOne(exercise);
        const insertedExercise = await exerciseCollection.findOne({ _id: result.insertedId });
        res.status(201).json(insertedExercise);
      } catch (err) {
        res.status(500).json({ error: `Error saving exercise data: ${err}` });
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
