import { makeOpenAI } from "./openaiClient";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export async function extractVision(imageUrl: string, prompt: string): Promise<string> {
  const openai = makeOpenAI();
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: imageUrl },
      ],
    },
  ];
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
  });
  return completion.choices[0]?.message?.content ?? "";
}

