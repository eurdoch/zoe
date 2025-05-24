import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const config = {
  AWS_REGION: process.env.AWS_REGION || "us-west-2",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  MODEL_ID: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
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

  async processPrompt(
    prompt,
  ) {
    try {
      const command = new InvokeModelCommand({
        modelId: config.MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          "anthropic_version": "bedrock-2023-05-31",
          "max_tokens": 8096,
          "messages": [
            {
              "role": "user",
              "content": [
                {
                  "type": "text",
                  "text": prompt,
                }
              ]
            }
          ]
        }),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(
        new TextDecoder().decode(response.body)
      );

      return responseBody.content[0].text;

    } catch (error) {
      console.error("Error processing request:", error);
      throw new Error(`Bedrock API error: ${error}`);
    }
  }

  async processImagesAndPrompt(
    imageBase64Array,
    prompt,
  ) {
    try {
      const content = [];
      
      // Add all images to content array
      imageBase64Array.forEach(imageBase64 => {
        content.push({
          "type": "image",
          "source": {
            "type": "base64",
            "media_type": "image/jpeg",
            "data": imageBase64,
          }
        });
      });
      
      // Add text prompt
      content.push({
        "type": "text",
        "text": prompt,
      });

      const command = new InvokeModelCommand({
        modelId: config.MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          "anthropic_version": "bedrock-2023-05-31",
          "max_tokens": 2048,
          "messages": [
            {
              "role": "user",
              "content": content
            }
          ]
        }),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(
        new TextDecoder().decode(response.body)
      );

      return responseBody.content[0].text;

    } catch (error) {
      console.error("Error processing request:", error);
      throw new Error(`Bedrock API error: ${error}`);
    }
  }
}

const bedrockService = new BedrockService();

export async function getMacros(imageBase64Array, prompt) {
  try {
    const result = await bedrockService.processImagesAndPrompt(
      imageBase64Array,
      prompt,
    );

    return result;
  } catch (error) {
    console.error("Error analyzing macro content:", error);
    throw error;
  }
}
