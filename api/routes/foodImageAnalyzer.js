import express from 'express';
import {extractNutritionInfo} from '../bedrock.js';
const router = express.Router();

export default function foodImageAnalyzerRoutes() {
  const logger = console;

  router.post('/', async (req, res) => {
    try {
      const { base64ImageString } = req.body;
      const prompt = `
        Look at this food image and estimate the macronutrient content.
        
        Analyze the food carefully and make an educated estimate of its nutritional content.
        If there are multiple food items, consider the entire meal.
        
        Return a JSON object with exactly these keys and structure:
        {
          "food_name": string,  // Brief description of the food in the image
          "calories": number,  // Estimated calories
          "protein_grams": number,  // Estimated protein in grams
          "carb_grams": number,  // Estimated carbohydrates in grams
          "fat_grams": number,  // Estimated fat in grams
          "confidence": string  // Your confidence level: "low", "medium", or "high"
        }
        
        Keep in mind that protein, carbs and fat contain 4, 4, and 9 calories per gram respectively.
        
        For confidence level:
        - "low": Hard to estimate accurately
        - "medium": Reasonable estimate but with uncertainty
        - "high": Common food with well-known nutritional value
        
        Make sure all numeric values are just numbers (not strings).
        Only return valid JSON with no explanation or other text.
      `;
      
      logger.info('POST /foodimageanalyzer');
      const result = await extractNutritionInfo(base64ImageString, prompt);
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
