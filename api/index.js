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

    app.post('/exercise', (req, res) => {
      const { name, reps, weight } = req.body;
      const exercise = { name, reps, weight, createdAt: new Date() };
      exerciseCollection.insertOne(exercise)
        .then(() => res.status(201).json({ message: 'Exercise data received' }))
        .catch((err) => {
          res.status(500).json({ error: `Error saving exercise data: ${err}` });
        });
    });

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

connectToDatabase();

