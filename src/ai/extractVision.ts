import { makeOpenAI } from './openaiClient'
import { fewshot, EquipmentType } from './fewshot'
import { validateAndNormalize } from '@/lib/normalize'

const SYSTEM_PROMPT =
  'Extract load details as JSON with keys distanceMi, offerFlat, weightLbs, widthFt, heightFt, stops, tarp, jobsite, itemType, pickupAt.'

const toMessages = (
  imageBase64: string,
  equipment: EquipmentType
) => {
  const shots = fewshot[equipment]
  const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }]
  shots.forEach((m) => messages.push(m))
  messages.push({
    role: 'user',
    content: [
      { type: 'input_text', text: 'Use this image to extract load details' },
      { type: 'input_image', image_url: `data:image/jpeg;base64,${imageBase64}` }
    ]
  })
  return messages
}

export async function extractVision(
  imageBase64: string,
  equipment: EquipmentType
) {
  const client = makeOpenAI()
  const messages = toMessages(imageBase64, equipment)
  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages
  })
  const content = resp.choices[0].message?.content ?? ''
  try {
    const parsed = JSON.parse(content)
    return validateAndNormalize(parsed)
  } catch {
    return { issues: [{ message: 'invalid_json' }] }
  }
}

