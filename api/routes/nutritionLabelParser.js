import express from 'express';
import {extractNutritionInfo} from '../bedrock.js';
const router = express.Router();

export default function nutritionLabelParserRoutes() {
  const logger = console; // Add a logger object

  // TODO retry on failure up to 3 times
  router.post('/', async (req, res) => {
    try {
      const { base64ImageString } = req.body;
      const prompt = `
        Look at this nutrition label image and extract the following information.
        
        Return a JSON object with exactly these keys and structure:
        {
          "serving_size": number,  // The numeric portion of the serving size (e.g., 1, 28, 100)
          "serving_unit": string,  // The unit of the serving (e.g., "g", "oz", "cup", "tbsp")
          "fat_grams_per_serving": number,  // Total fat in grams per serving
          "carb_grams_per_serving": number,  // Total carbohydrates in grams per serving
          "protein_grams_per_serving": number  // Protein in grams per serving
        }
        
        Make sure all numeric values are just numbers (not strings). 
        If a value is not found, use null.
        Do not include additional fields.
        Only return valid JSON with no explanation or other text.
      `;
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

