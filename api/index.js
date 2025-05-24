import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import exerciseRoutes from './routes/exerciseRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import weightRoutes from './routes/weightRoute.js';
import supplementRoutes from './routes/supplementRoute.js';
import macroRoutes from './routes/macro.js';
import verificationRoutes from './routes/verificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authenticateToken from './middleware/auth.js';
import verifyPremiumStatus from './middleware/premiumAuth.js';
import 'dotenv/config';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Enable CORS for all routes - important for development with mobile apps
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
    const verificationCollection = database.collection('verification');

    app.use(express.static(path.join(__dirname, '../web/dist')));

    app.get('/ping', (_, res) => {
      res.send('Pong');
    });

    // Public routes (no authentication required)
    app.use('/verify', verificationRoutes(userCollection, verificationCollection));

    // Requires premium 
    app.use('/macro', authenticateToken, verifyPremiumStatus(userCollection), macroRoutes());
    app.use('/food', authenticateToken, verifyPremiumStatus(userCollection), foodRoutes(foodCollection));

    // Protected routes (require JWT authentication)
    app.use('/exercise', authenticateToken, exerciseRoutes(exerciseCollection));
    app.use('/workout', authenticateToken, workoutRoutes(workoutCollection));
    app.use('/weight', authenticateToken, weightRoutes(weightCollection));
    app.use('/supplement', authenticateToken, supplementRoutes(supplementCollection));
    app.use('/user', userRoutes(userCollection));

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`);
    });

  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

connectToDatabase();
