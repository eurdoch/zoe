import express from 'express';
import {extractNutritionInfo} from '../bedrock.js';
const router = express.Router();

export default function nutritionLabelParserRoutes() {

  router.post('/', async (req, res) => {
    try {
      const { base64ImageString } = req.body;
      const prompt = "Return a JSON list of the nutrition info.";
      const result = await extractNutritionInfo(base64ImageString, prompt);
      res.status(201).json(result);
    } catch (err) {
      console.error('POST /supplement error:', err);
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  return router;
}
