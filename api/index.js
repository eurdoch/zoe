import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { exec } from 'child_process';
import { MongoClient } from 'mongodb';
import exerciseRoutes from './routes/exerciseRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import weightRoutes from './routes/weightRoute.js';
import supplementRoutes from './routes/supplementRoute.js';
import nutritionParserRoutes from './routes/nutritionLabelParser.js';
import verificationRoutes from './routes/verificationRoutes.js';
import authenticateToken from './middleware/auth.js';
import 'dotenv/config';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({limit: '5mb'}))

const uri = process.env.MONGO_URI;
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
    const userCollection = database.collection('users');

    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
    // hardcoded repo path
    const repoPath = '/home/ubuntu/zoe';

    const verifySignature = (payload, signature) => {
      const hash = createHmac('sha256', WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');
      const calculatedSignature = `sha256=${hash}`;
      
      return timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
      );
    };

    app.use(express.static(path.join(__dirname, '../web/dist')));

    app.get('/ping', (req, res) => {
      res.send('Pong');
    });

    app.post('/webhook', (req, res) => {
      console.log('Webhook received');
      const signature = req.headers['x-hub-signature-256'];

      try {
        if (!verifySignature(req.body, signature)) {
          console.err("Invalid signature");
          return res.status(401).send("invalid signature");
        }
      } catch (err) {
        console.err("Signature verification failed");
        return res.status(401).send("signature verification failed");
      }

      if (req.body.ref === 'refs/heads/master') {
        exec(`cd ${repoPath} && git pull origin master && yarn web:build && pm2 reload zoe`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error: ${error}`);
            return res.status(500).send(error);
          }
          console.log(`Pull successful: ${stdout}`);
          res.status(200).send('Pull successful');
        });
      } else {
        res.status(200).send('Not master branch, no action taken');
      }
    });

    // Public routes (no authentication required)
    app.use('/nutritionimg', nutritionParserRoutes());
    app.use('/verify', verificationRoutes(userCollection));
    
    // Protected routes (require JWT authentication)
    app.use('/food', authenticateToken, foodRoutes(foodCollection));
    app.use('/exercise', authenticateToken, exerciseRoutes(exerciseCollection));
    app.use('/workout', authenticateToken, workoutRoutes(workoutCollection));
    app.use('/weight', authenticateToken, weightRoutes(weightCollection));
    app.use('/supplement', authenticateToken, supplementRoutes(supplementCollection));

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`);
    });

  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

connectToDatabase();
