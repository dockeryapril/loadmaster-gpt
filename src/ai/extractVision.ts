import { makeOpenAI, DEFAULT_OPENAI_MODEL } from "./openaiClient";

export async function extractVision(imageBase64: string, prompt: string): Promise<string> {
  const client = makeOpenAI();
  const response = await client.responses.create({
    model: DEFAULT_OPENAI_MODEL,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_base64: imageBase64 }
        ]
      }
    ]
  });
  return response.output_text ?? "";
}
