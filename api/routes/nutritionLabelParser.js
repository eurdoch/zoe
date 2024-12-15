import express from 'express';
import {extractNutritionInfo} from '../bedrock.js';
const router = express.Router();

export default function nutritionLabelParserRoutes() {

  router.post('/', async (req, res) => {
    try {
      const { base64ImageString } = req.body;
      const prompt = "Return as JSON with keys \"nutritional_info\" and \"serving_size\" where nutritional_info is a list of JSON objects containing keys \"name\", \"amount_per_serving\" and \"unit\". Only return the JSON.";
      const result = await extractNutritionInfo(base64ImageString, prompt);
      res.status(201).json(result);
    } catch (err) {
      console.error('POST /supplement error:', err);
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  return router;
}
