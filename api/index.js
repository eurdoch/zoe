import express from 'express';
import { MongoClient } from 'mongodb';
import exerciseRoutes from './routes/exerciseRoutes.js';

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

    // Mount exercise routes
    app.use('/exercise', exerciseRoutes(exerciseCollection));

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

connectToDatabase();
