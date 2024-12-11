import express from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';
import { MongoClient } from 'mongodb';
import exerciseRoutes from './routes/exerciseRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import weightRoutes from './routes/weightRoute.js';
import supplementRoutes from './routes/supplementRoute.js';

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
    const foodCollection = database.collection('food');
    const workoutCollection = database.collection('workout');
    const weightCollection = database.collection('weight');
    const supplementCollection = database.collection('supplement');

    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
    const repoPath = '/home/ubuntu/vitale';

    app.get('/', (req, res) => {
      res.send('Ping a da pong');
    });

    app.post('/webhook', (req, res) => {
      const signature = req.headers['x-hub-signature-256'];
      const hash = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');
      const calculatedSignature = `sha256=${hash}`;

      if (signature !== calculatedSignature) {
        return res.status(401).send('Invalid signature');
      }

      if (req.body.ref === 'refs/heads/main') {
        exec(`cd ${repoPath} && git pull origin main`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error: ${error}`);
            return res.status(500).send(error);
          }
          console.log(`Pull successful: ${stdout}`);
          res.status(200).send('Pull successful');
        });
      } else {
        res.status(200).send('Not main branch, no action taken');
      }
    });

    app.use('/exercise', exerciseRoutes(exerciseCollection));
    app.use('/food', foodRoutes(foodCollection));
    app.use('/workout', workoutRoutes(workoutCollection));
    app.use('/weight', weightRoutes(weightCollection));
    app.use('/supplement', supplementRoutes(supplementCollection));

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

connectToDatabase();
