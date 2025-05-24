import express from 'express';
import {getMacros} from '../bedrock.js';
const router = express.Router();

export default function macroRoutes() {
  const logger = console;

  router.post('/', async (req, res) => {
    try {
      const { images, data } = req.body;
      const prompt = `
        Using the provided images and data, determine the macronutrient content.

        Data: ${JSON.stringify(data)}
        
        Return a JSON object with exactly these keys and structure:
        {
          "macros": {
            "calories": number,  // Estimated calories
            "carbs": number,  // Estimated carbohydrates in grams
            "fat": number,  // Estimated fat in grams
            "protein": number,  // Estimated protein in grams
          },
          "confidence": string  // Your confidence level: "low", "medium", or "high"
        }
        
        For confidence level:
        - "low": Hard to estimate accurately
        - "medium": Reasonable estimate but with uncertainty
        - "high": Common food with well-known nutritional value
        
        Make sure all numeric values are just numbers (not strings).
        Only return valid JSON with no explanation or other text.
      `;
      
      logger.info('POST /macro');
      const result = await getMacros(images, prompt);
      console.log(result);
      const resultJson = JSON.parse(result);
      res.status(201).json(resultJson);
    } catch (err) {
      logger.error('POST /macro error:', err);
      res.status(500).json({ error: 'Failed to analyze macro content.' });
    }
  });

  return router;
}
