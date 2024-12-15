import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const config = {
  AWS_REGION: process.env.AWS_REGION || "us-east-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  MODEL_ID: "anthropic.claude-3-5-sonnet-20240620-v1:0",
};

class BedrockService {
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: config.AWS_REGION,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY
      }
    });
  }

  async processImageAndPrompt(
    imageBase64,
    prompt,
    options = {}
  ) {
    const defaultParams = {
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 0.9,
      ...options
    };

    const input = {
      prompt: `<image>${imageBase64}</image>
${prompt}`,
      image_base64: imageBase64,
      ...defaultParams
    };

    try {
      const command = new InvokeModelCommand({
        modelId: config.MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(input)
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(
        new TextDecoder().decode(response.body)
      );

      return responseBody.completion;

    } catch (error) {
      console.error("Error processing request:", error);
      throw new Error(`Bedrock API error: ${error}`);
    }
  }
}

export async function extractNutritionInfo(imageBase64String, prompt) {
  try {
    const bedrockService = new BedrockService();
    const result = await bedrockService.processImageAndPrompt(
      imageBase64String,
      prompt,
    );

    return result;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}

