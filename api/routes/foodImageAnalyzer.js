import express from 'express';
import {extractNutritionInfo, getNutritionInfo} from '../bedrock.js';
const router = express.Router();

export default function foodImageAnalyzerRoutes() {
  const logger = console;

  router.post('/', async (req, res) => {
    try {
      const { base64ImageString } = req.body;
      const prompt = `
        Using the data determine the macronutrient content.

        Data: {req.data}
        
        Return a JSON object with exactly these keys and structure:
        {
          "protein_grams": number,  // Estimated protein in grams
          "carb_grams": number,  // Estimated carbohydrates in grams
          "fat_grams": number,  // Estimated fat in grams
          "confidence": string  // Your confidence level: "low", "medium", or "high"
        }
        
        For confidence level:
        - "low": Hard to estimate accurately
        - "medium": Reasonable estimate but with uncertainty
        - "high": Common food with well-known nutritional value
        
        Make sure all numeric values are just numbers (not strings).
        Only return valid JSON with no explanation or other text.
      `;
      
      logger.info('POST /foodimageanalyzer');
      const result = await getNutritionInfo(base64ImageString, prompt);
      console.log(result);
      const resultJson = JSON.parse(result);
      res.status(201).json(resultJson);
    } catch (err) {
      logger.error('POST /foodimageanalyzer error:', err);
      res.status(500).json({ error: 'Failed to analyze food image.' });
    }
  });

  return router;
}
