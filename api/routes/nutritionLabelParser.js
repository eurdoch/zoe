import express from 'express';
import {extractNutritionInfo} from '../bedrock.js';
const router = express.Router();

export default function nutritionLabelParserRoutes() {
  const logger = console; // Add a logger object

  // TODO retry on failure up to 3 times
  router.post('/', async (req, res) => {
    try {
      const { base64ImageString } = req.body;
      const prompt = "Return as JSON with keys \"nutritional_info\" and \"serving_size\" where nutritional_info is a list of JSON objects containing keys \"name\", \"amount_per_serving\" and \"unit\". Only return the JSON.";
      logger.info('POST /nutritionimg'); // Log before extraction
      const result = await extractNutritionInfo(base64ImageString, prompt);
	    console.log(result);
      const resultJson = JSON.parse(result);
      res.status(201).json(resultJson);
    } catch (err) {
      logger.error('POST /nutritionimg error:', err); // Log error
      res.status(500).json({ error: 'Failed to extract nutrition info.' });
    }
  });

  return router;
}

