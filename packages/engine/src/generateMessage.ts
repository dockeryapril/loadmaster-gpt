import { MESSAGE_TEMPLATES, LoadData, NegotiationCalculation } from './types.js';

export function generateMessage(
  load: LoadData,
  calculation: NegotiationCalculation,
  origin: string = '',
  destination: string = ''
): { subject: string; message: string } {
  const template = MESSAGE_TEMPLATES.find(t => t.strategy === calculation.suggested_strategy) 
    || MESSAGE_TEMPLATES[0]; // fallback to standard

  const placeholders = {
    '{origin}': origin,
    '{destination}': destination,
    '{miles}': load.miles.toString(),
    '{weight}': load.weight?.toString() || '',
    '{anchor_rate}': calculation.anchor_rate.toString(),
    '{target_rate}': calculation.target_rate.toString(),
    '{floor_rate}': calculation.floor_rate.toString(),
  };

  let subject = template.subject;
  let message = template.message;

  Object.entries(placeholders).forEach(([placeholder, value]) => {
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
    message = message.replace(new RegExp(placeholder, 'g'), value);
  });

  return { subject, message };
}