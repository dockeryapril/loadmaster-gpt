import { makeOpenAI } from './openaiClient'
import { fewshot, EquipmentType } from './fewshot'
import { validateAndNormalize } from '@/lib/normalize'

const SYSTEM_PROMPT =
  'Extract load details as JSON with keys distanceMi, offerFlat, weightLbs, widthFt, heightFt, stops, tarp, jobsite, itemType, pickupAt.'

const toMessages = (
  text: string,
  equipment: EquipmentType
) => {
  const shots = fewshot[equipment]
  const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }]
  shots.forEach((m) => messages.push(m))
  messages.push({ role: 'user', content: text })
  return messages
}

export async function extractText(text: string, equipment: EquipmentType) {
  const client = makeOpenAI()
  const messages = toMessages(text, equipment)
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

